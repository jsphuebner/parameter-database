<?php
session_start();
header('Content-Type: application/json');

define('IN_PHPBB', true);

$phpbb_root_path = (defined('PHPBB_ROOT_PATH')) ? PHPBB_ROOT_PATH : '../forum/';
$phpEx = substr(strrchr(__FILE__, '.'), 1);
include($phpbb_root_path . 'common.' . $phpEx);

// Start session management
$user->session_begin();
$auth->acl($user->data);
$user->setup();

$request->enable_super_globals();

require ('config.inc.php');

$sqlDrv->connect();

$OFFSET = 0;
$QUERYLIMIT = 10;

if(isset($_GET['offset']))
{
	$OFFSET = intval($_GET['offset']);
}

if(isset($_GET['id']))
{
	$id = $_GET['id'];

	if(isset($_GET['rating']))
	{
		$data = $sqlDrv->arrayQuery("SELECT rating, count, stamp, ip FROM pd_rating WHERE id=$id");
		$rating = $_GET['rating'];
		$count = intval($data[0]["count"]);

		if (empty($rating)) {
			echo json_encode(['rating' => floatval($data[0]["rating"]),'count' => $count]);
		}else{

			if(isset($_SESSION['rating-'. $id])) {
				die(json_encode([]));
			}else{

				$timestamp = date('Y-m-d H:i:s');
				if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
				    $ip = $_SERVER['HTTP_CLIENT_IP'];
				}else if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
				    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
				} else {
				    $ip = $_SERVER['REMOTE_ADDR'];
				}

				$sqlDrv->query("START TRANSACTION");
				if (empty($data)) {
					$sqlDrv->query("INSERT pd_rating (id,rating,count) VALUES ($id,$rating,1)");
				}else{
					//Brute force security prevention against non-cookie submitions
					$securitystamp = date('Y-m-d H:i:s', strtotime('+15 minutes'));
					if ($data[0]["ip"] == $ip && $data[0]["stamp"] < $securitystamp) {
						die(json_encode([]));
					}
					$rating = (floatval($data[0]["rating"]) * $count + floatval($rating)) / ($count+1);
					$sqlDrv->query("UPDATE pd_rating SET rating=" .$rating. ",count=count+1,stamp='" .$timestamp. "',ip='" .$ip. "' WHERE id=$id");
				}
				$sqlDrv->query("COMMIT");

				$_SESSION['rating-'. $id] = $rating;
			}

			echo json_encode(['rating' => number_format($rating, 2, '.', ''),'count' => ($count+1)]);
		}
	}
	else if(isset($_GET['subscribe']))
	{
		if(isset($_GET['token']))
		{
			$token = $_GET['token'];
			$filter = explode(':', $_GET['filter']);

			//Find category ids from names (takes less DB space)
			//TODO: Use catindex in GUI - no conversion will be needed here
			$filterId = $sqlDrv->arrayQuery("SELECT DISTINCT catindex as id, catindex FROM pd_parameters WHERE category IN ('" . implode("','", $filter) . "')");

			$sqlDrv->query("START TRANSACTION");
			$sqlDrv->query("INSERT pd_subscription (token, id, filter) VALUES ('$token', $id, '" .implode(":", dataIdArray($filterId)). "')");
			$sqlDrv->query("COMMIT");

			//Remove OLD/UNUSED/INACTIVE Tokens (6 Month)
			$sqlDrv->query("DELETE token FROM pd_subscription WHERE stamp >= (NOW() + INTERVAL 6 MONTH)");
			
			echo json_encode(['token' => $token]);
		}else{
			echo json_encode([]);
		}
	}else if(isset($_GET['subscribers'])) {

		if (!$user->data['is_registered']) {
			die(json_encode(['error'=>'login']));
		}
		//TODO: Secure by $user->data['user_id']?
		$subs = $sqlDrv->arrayQuery("SELECT id, token, stamp FROM pd_subscription WHERE id=$id");
		echo json_encode($subs);
	}
	else if(isset($_GET['metadata']))
	{
		$metadata = $sqlDrv->mapQuery("SELECT name,value FROM pd_namedmetadata WHERE id=$id", "name");
		$notes = $sqlDrv->scalarQuery("SELECT notes from pd_datasets WHERE id=$id");
		$notes = str_replace("\n", "<br>\n", $notes);
		$metadata += ['Notes' => $notes];

		echo json_encode($metadata);
	}
	else if(isset($_GET['download']))
	{
		$metadata = $sqlDrv->mapQuery("SELECT name,value FROM pd_namedmetadata WHERE id=$id", "name");
		$httpHeader = "Content-Disposition: attachment; filename=\"" . $metadata["Hardware Variant"] . "-" . $metadata["Version"] . "-";

		$sql = "SELECT category, name, unit, value FROM pd_namedata WHERE setid=$id";
		if(isset($_GET['filter']))
		{
			if (strpos($_GET['filter'], "Motor") !== false) {
				$httpHeader .= $metadata["Motor Type"] . "-";
			}
			if (strpos($_GET['filter'], "Inverter") !== false) {
				$httpHeader .= $metadata["Inverter Type"]. "-";
			}
			$filter = explode(':', $_GET['filter']);
			$sql .= ' AND category IN  ("' . implode('","', $filter) . '")';
		}
		$httpHeader .= $metadata["Driven wheels"] . "-" . $metadata["Timestamp"] . ".json\"";

		$rows = $sqlDrv->arrayQuery($sql);
		$data = [];

		foreach ($rows as $row)
		{
			$data += [$row['name'] => $row['value']];
		}

		header($httpHeader);
		echo json_encode($data, JSON_PRETTY_PRINT);
	}
	else if(isset($_GET['remove']))
	{
		if (!$user->data['is_registered']) {
			die(json_encode(['error'=>'login']));
		}

		$userId = $sqlDrv->scalarQuery("SELECT value FROM pd_metadata,pd_datasets d WHERE setid=d.metadata AND d.id=$id AND metaitem=4");
		$metasetId = $sqlDrv->scalarQuery("SELECT setid FROM pd_metadata,pd_datasets d WHERE setid=d.metadata AND d.id=$id AND metaitem=4");
		
		if ($userId == $user->data['user_id']) { //verify it belongs to user
			
			$sqlDrv->query("DELETE FROM pd_rating WHERE id=$id");
			$sqlDrv->query("DELETE FROM pd_subscription WHERE id=$id");
			$sqlDrv->query("DELETE FROM pd_data WHERE setid=$id");
			$sqlDrv->query("DELETE FROM pd_datasets WHERE id=$id");
			$sqlDrv->query("DELETE FROM pd_metadata WHERE setid=$metasetId");

			header('Content-Type: text/html');
			echo "Parameter ID: " .$id. " Deleted. <a href='my.html'>Back to My Profile</a>";
		}else{
			die(json_encode(['error'=>'not allowed']));
		}

	}else{
		$data = $sqlDrv->arrayQuery("SELECT category, name, unit, value FROM pd_namedata WHERE setid=$id");

		foreach ($data as &$row)
		{
			$row['enum'] = parseEnum($row['unit']);
		}

		echo json_encode($data);
	}
}
else if(isset($_GET['user']))
{
	if ($user->data['is_registered']) {
		echo json_encode(['id' => $user->data['user_id']]);
	}else{
		echo json_encode([]);
	}
}
else if(isset($_POST['filter']))
{
	header('Content-Type: text/html');

	$filter = [];
	$md = $_POST['md'];

	foreach ($md as $id => $value)
	{
		if($value != "" && $value != "0")
			$filter += [$id => $value];
	}
	if (empty($filter)) {
		unset($_SESSION['filter']);
	}else{
		$_SESSION['filter'] = $filter;
	}
	
	header('Location: index.html');
}
else if(isset($_GET['filter']))
{
	if(isset($_SESSION['filter']))
	{
		echo json_encode($_SESSION['filter']);
	}else{
		echo json_encode([]);
	}
}
else if(isset($_GET['pages']))
{
	$pages = $sqlDrv->scalarQuery("SELECT COUNT(id) FROM pd_datasets");
	$data = ['pages' => ceil($pages/$QUERYLIMIT)-1];
	$data += ['offset' => $QUERYLIMIT];

	echo json_encode($data);
}
else if(isset($_POST['submit']) || isset($_POST['update']))
{
	if (!$user->data['is_registered']) {
		die(json_encode(['error'=>'login']));
	}

	header('Content-Type: text/html');

	if(isset($_POST['update'])) {

		echo "Update ";

		$filter = explode(':', $_POST['update']);

		//....
		
	}else{

		echo "Add New ";

		$parameters = $_SESSION['data'];

		$md = $_POST['md'];
		$notes = $_POST['notes'];
		
		$sqlDrv->query("START TRANSACTION");
		$setId = $sqlDrv->scalarQuery("SELECT MAX(setid) FROM pd_metadata") + 1;
		$sql = "INSERT pd_metadata (setid, metaitem, value) VALUES ";

		foreach ($md as $id => $value)
		{
			$sql.= "($setId, $id, '$value'),";
		}
		
		$swVer = $parameters->version->enums[$parameters->version->value];
		$hwVer = $parameters->hwver->enums[$parameters->hwver->value];

		$sql .= "($setId, 1, '$swVer'),";
		$sql .= "($setId, 3, '$hwVer'),";
		$sql .= "($setId, 2, NOW()),";
		$sql .= "($setId, 4, ". $user->data['user_id']. ")";
		$sqlDrv->query($sql);

		$index = 0;
		$catIndex = -1;
		$lastCat = "";
		foreach ($parameters as $name => $attributes)
		{
			if ($attributes->isparam && $attributes->category != "Testing")
			{
				if ($lastCat != $attributes->category)
				{
					$lastCat = $attributes->category;
					$catIndex++;
				}

				$params[] = "('$attributes->category', $catIndex, $index, '$name', '$attributes->unit')";
			}
			$index++;
		}
		
		$sql = "INSERT IGNORE pd_parameters (category, catindex, fwindex, name, unit) VALUES ".implode(",", $params);
		$sqlDrv->query($sql);
		$paramMap = $sqlDrv->mapQuery("SELECT id, name FROM pd_parameters", "name");
		$sqlDrv->query("INSERT pd_datasets (metadata,notes) VALUES ($setId,'$notes')");
		$dataId = $sqlDrv->scalarQuery("SELECT LAST_INSERT_ID()");

		foreach ($parameters as $name => $attributes)
		{
			if ($attributes->isparam && $attributes->category != "Testing")
			{
				$paramId = $paramMap[$name];
				$values[] = "($dataId, $paramId, $attributes->value)";
			}
		}
		
		$sql = "INSERT IGNORE pd_data (setid, parameter, value) VALUES ".implode(",", $values);
		$sqlDrv->query($sql);

		$sqlDrv->query("COMMIT");
	}

	unset($_SESSION['data']);

	echo "Done. <a href='my.html'>My Parameters</a>";
}
else if(isset($_GET['submit']))
{
	if (!$user->data['is_registered']) {
		die(json_encode(['error'=>'login']));
	}

	if(isset($_SESSION['data']))
	{
		/*
		Update Logic:
		- Check if TOKEN belongs to submited user? (self-subscribed to your own parameters)
			> YES ask ADD new or UPDATE existing (we know which token belongs to which parameter id)
			> NO submit NEW
		- API show differences (like git compare)
		*/
		if(isset($_GET['token']))
		{
			$token = $_GET['token'];
			$userId = $sqlDrv->scalarQuery("SELECT
				m.value AS id
			FROM pd_namedmetadata m
				JOIN pd_subscription s
			WHERE
		        s.id = m.id AND
		        m.name = 'UserId' AND
				s.token = '$token'");

			if ($userId == $user->data['user_id']) { //verify it belongs to user
				//NEW parameters
				$data = json_decode(json_encode($_SESSION['data']),true);

				//Check make sure Version (Sine/FOC) + Hardware match
				$answers = $sqlDrv->mapQuery("SELECT 
					m.name AS name,
					m.value AS value
				FROM pd_namedmetadata m
					JOIN pd_subscription s
				WHERE
					m.id = s.id AND
					(m.name = 'Version' OR m.name = 'Hardware Variant') AND
					s.token = '$token'", "name");
				//print_r($answers); //debug

				$swVer = $data['version']['enums'][$data['version']['value']];
				$hwVer = $data['hwver']['enums'][$data['hwver']['value']];

				if ($answers['Hardware Variant'] != $hwVer) {
					die(json_encode(['error'=>'hardware']));
				}

				//EXISTING parameters
				$rows = $sqlDrv->arrayQuery("SELECT 
					d.setid AS setid,
					p.category AS category,
					p.name AS name,
					p.unit AS unit,
					d.value AS value
				FROM pd_parameters p
					JOIN pd_data d
					JOIN pd_subscription s
				WHERE
					p.id = d.parameter AND
					s.id = d.setid AND
					s.token = '$token'");

				$difference = [];
				foreach ($rows as $row)
				{
					$diff = [];
					if($data[$row['name']]['value'] != floatval($row['value'])) {
						$diff += ['value' => ['old' => floatval($row['value']), 'new' => $data[$row['name']]['value']]];
					}
					if(sizeof($diff) > 0) {
						$difference += [$row['name'] => $diff];
					}
				}
				if(sizeof($difference) > 0) {
					$data += ['DIFF' => $difference];
				}

				echo json_encode($data);
			}else{
				echo json_encode($_SESSION['data']);
			}
		}else{
			echo json_encode($_SESSION['data']);
		}
	}else{
		echo json_encode([]);
	}
}
else if(isset($_FILES['data']) || isset($_POST['data']))
{
	header('Content-Type: text/html');

	if (isset($_FILES['data'])) {
		$data = file_get_contents($_FILES['data']['tmp_name']);
	}else{
		$data  = $_POST['data'];
	}
	$data = json_decode($data);

	unset($_SESSION['data']);

	//regulat json import support
	if(!$data->version->enums) {
		$data->version->enums = parseEnum($data->version->unit);
		$data->hwver->enums = parseEnum($data->hwver->unit);
	}

	if (json_last_error() !== JSON_ERROR_NONE) {
	    $_SESSION['data'] = json_decode(json_encode(['error'=>'json']));
	}else if(!$data->version) {
		$_SESSION['data'] = json_decode(json_encode(['error'=>'validation']));
	}else{
		$_SESSION['data'] = $data;
	}

	if (!$user->data['is_registered']) {
		
		$loginRedirect = '/parameters/add.html';
		if(isset($_POST['token'])) {
		 	$loginRedirect .= '?token='.$_POST['token'];
		}
		die('You are not logged in, please <a href="https://openinverter.org/forum/ucp.php?mode=login&redirect=' .$loginRedirect. '">login to the forum</a>');
	}

	if(isset($_POST['token'])) {
	 	header('Location: add.html?token=' .$_POST['token']);
	}else{
	 	header('Location: add.html');
	}
}
else if(isset($_GET['questions']))
{
	$sql = "SELECT id, name, question, type, options FROM pd_metaitems WHERE question IS NOT NULL";
	$data = [];

	foreach ($sqlDrv->arrayQuery($sql) as $row)
	{
		if($row['type'] == 'select' && $row['options'] == null) {
			$options = $sqlDrv->arrayQuery("SELECT DISTINCT value as id FROM pd_metadata where metaitem=" .$row['id']);
			$options = implode(",", dataIdArray($options));
		}else{
			$options = $row['options'];
		}
		$question = [$row['id'] => stripslashes($row['question']),'type' => $row['type'],'options' => $options];

		//Pre-Fill Answers
		if(isset($_SESSION['filter'])) //Filter
		{
			$question += ['value' => $_SESSION['filter'][$row['id']]];
		}
		else if(isset($_GET['token'])) //Existing Parameter
		{
			$token = $_GET['token'];
			$answers = $sqlDrv->mapQuery("SELECT 
					m.metaitem AS id,
					m.value AS value
				FROM pd_metadata m
					JOIN pd_subscription s
				WHERE
					m.setid = s.id AND
					s.token = '$token'", "id");
			//print_r($answers); //debug

			$question += ['value' => $answers[$row['id']]];
		}else{
			$question += ['value' => null];
		}
		array_push($data,$question);
	}

	echo json_encode($data);
}
else if(isset($_GET['my']))
{
	if (!$user->data['is_registered']) {
		die(json_encode(['error'=>'login']));
	}

	$dataId = $sqlDrv->arrayQuery("SELECT id FROM pd_namedmetadata WHERE name='Userid' AND value=" .$user->data['user_id']. " LIMIT $OFFSET, $QUERYLIMIT");
	
	if(count($dataId) == 0) {
		die(json_encode([]));
	}
	//print_r(dataIdArray($dataId)); //debug

	if(isset($_GET['subscribers'])) {
		$subs = $sqlDrv->arrayQuery("SELECT id, token, stamp FROM pd_subscription WHERE id IN (" .implode(",", dataIdArray($dataId)). ") ORDER BY id ASC");
		echo json_encode($subs);
	}else{
		$rows = $sqlDrv->arrayQuery("SELECT id, name, value FROM pd_namedmetadata WHERE name!='Userid' AND id IN (" .implode(",", dataIdArray($dataId)). ") ORDER BY id ASC"); // LIMIT $OFFSET, " .($QUERYLIMIT * 10));
		$subs = $sqlDrv->mapQuery("SELECT id, COUNT(*) AS total FROM pd_subscription WHERE id IN (" .implode(",", dataIdArray($dataId)). ") GROUP BY id","id");
		//print_r($subs); //debug

		$lastId = 0;
		$data = [];

		foreach ($rows as $row)
		{
			if ($lastId != $row['id'])
			{
				array_push($data, ['id' => intval($row['id'])]);
			}

			$data[sizeof($data)-1] += [$row['name'] => $row['value']];

			$lastId = $row['id'];
		}
		
		//Add subscriber count as last
		$index = 0;
		foreach ($data as $row)
		{
			if(isset($subs[$row['id']])) {
				$data[$index] += ['Subscribers' => intval($subs[$row['id']])];
			}else{
				$data[$index] += ['Subscribers' => 0];
			}
			$index++;
		}
		echo json_encode($data);
	}
}
else if(isset($_GET['token']))
{
	header("Access-Control-Allow-Origin: *");

	//No authentication needed only token #
	$token = $_GET['token'];

	$dataId = $sqlDrv->arrayQuery("SELECT id, filter FROM pd_subscription WHERE token='$token'");
	//print_r($dataId); //debug

	if(count($dataId) == 0) {
		die(json_encode([]));
	}

	//Set last activity
	$timestamp = date('Y-m-d H:i:s');
	$sqlDrv->query("UPDATE pd_subscription SET stamp='$timestamp' WHERE token='$token'");

	$filter = explode(':', $dataId[0]['filter']);
	
	$timestamp = $sqlDrv->scalarQuery("SELECT value AS timestamp		
	FROM pd_namedmetadata m
		JOIN pd_subscription s
	WHERE
        s.id = m.id AND
        m.name = 'Timestamp' AND
		s.token = '$token'");

	$rows = $sqlDrv->arrayQuery("SELECT 
		d.setid AS setid,
		p.category AS category,
		p.name AS name,
		p.unit AS unit,
		d.value AS value
	FROM pd_parameters p
		JOIN pd_data d
		JOIN pd_subscription s
	WHERE
		p.id = d.parameter AND
		s.id = d.setid AND
		s.token = '$token' AND
		p.catindex IN (" .implode(",", $filter). ")");
	//print_r($rows); //debug

	$data = ["timestamp" => $timestamp];

	foreach ($rows as $row)
	{
		$data += [$row['name'] => $row['value']];
	}
	echo json_encode($data, JSON_PRETTY_PRINT);
}else{

	$sql = "SELECT id, name, value FROM pd_namedmetadata WHERE name != 'Userid' ";
	
	if(isset($_SESSION['filter']))
	{
		$sqlFilter = "SELECT DISTINCT setid AS id FROM pd_metadata ";
		$index=0;
		foreach ($_SESSION['filter'] as $id => $value)
		{
			$condition = "LIKE '%" . $value . "%'";
			if (is_numeric($value)) {
				$condition = ">= " . $value . "";
			}
			if($index == 0) {
				$sqlFilter .= "WHERE (metaitem = $id AND value " .$condition. ") ";
			}else{
				$sqlFilter .= "OR (metaitem = $id AND value " .$condition. ") ";
			}
			$index++;
		}
		$sqlFilter .= "LIMIT $OFFSET, $QUERYLIMIT";
		//echo $sqlFilter;

		$dataId = $sqlDrv->arrayQuery($sqlFilter);
		if(sizeof($dataId) == 0) {
			die(json_encode([]));
		}else{
			$sql .= "AND id IN (" . implode(",", dataIdArray($dataId)) . ") ";
		}
	}
	
	$sql .= "ORDER BY id ASC LIMIT $OFFSET, ". ($QUERYLIMIT * 10);
	//echo $sql;

	$rows = $sqlDrv->arrayQuery($sql);
	$lastId = 0;
	$data = [];
	
	foreach ($rows as $row)
	{
		if ($lastId != $row['id'])
		{
			array_push($data, ['id' => intval($row['id'])]);
		}
		$data[sizeof($data)-1] += [$row['name'] => $row['value']];
		
		$lastId = $row['id'];
	}

	echo json_encode($data);
}

function dataIdArray($dataId)
{
	$idArray = [];
	foreach ($dataId as $id) {
		array_push($idArray, $id['id']);
	}
	return $idArray;
}

function parseEnum($unit)
{
	$enum = false;
	$pattern = "/(\-{0,1}[0-9]+)=([a-zA-Z0-9_\-\.]+)[,\s]{0,2}|([a-zA-Z0-9_\-\.]+)[,\s]{1,2}/";
	if (preg_match_all($pattern, $unit, $matches))
	{
		for ($i = 0; $i < count($matches[0]); $i++)
		{
			$enum[$matches[1][$i]] = $matches[2][$i];
		}
	}
	return $enum;
}

?>
