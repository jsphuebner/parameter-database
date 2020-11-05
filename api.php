<?php
session_start();
header('Content-Type: application/json');
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

	if(isset($_GET['metadata']))
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
		header ("Content-Disposition: attachment; filename=\"" . $metadata["Hardware Variant"] . "-" . $metadata["Version"] . "-" .$metadata["Motor Type"] . "-" .$metadata["Inverter Type"]. "-" . $metadata["Driven wheels"] . "-" . $metadata["Timestamp"] . ".json\"");

		$rows = $sqlDrv->arrayQuery("SELECT category, name, unit, value FROM pd_namedata WHERE setid=$id");
		$data = [];

		foreach ($rows as $row)
		{
			$data += [$row['name'] => $row['value']];
		}
		
		echo json_encode($data);
	}else{
		$data = $sqlDrv->arrayQuery("SELECT category, name, unit, value FROM pd_namedata WHERE setid=$id");
		echo json_encode($data);
	}
}
else if(isset($_POST['filter']))
{
	header('Content-Type: text/html');

	$filter = [];
	$md = $_POST['md'];
	foreach ($md as $id => $value)
	{
		if($value != "")
			$filter += [$id => $value];
	}
	$_SESSION['filter'] = $filter;

	//echo json_encode($filter);
	header('Location: index.html');
}
else if(isset($_GET['filter']))
{
	echo json_encode($_SESSION['filter']);
}
else if(isset($_GET['remove']) && isset($_GET['id']))
{
	header('Content-Type: text/html');

	$userId = phpBBAuthenticate();

	if($userId != $_GET['id'])
	{
		die('Authentication Error');
	}

	$sqlDrv->query("DELETE FROM pd_data WHERE setid=" .$userId);
	$sqlDrv->query("DELETE FROM pd_datasets WHERE id=" .$userId);
}
else if(isset($_POST['submit']))
{
	header('Content-Type: text/html');

	phpBBAuthenticate();

	$request->enable_super_globals();
	$data = json_encode($_SESSION['data']);
	$parameters = json_decode($data);

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
	$sql .= "($setId, 4, $userId)";
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

	unset($_SESSION['data']);

	echo "Done. <a href='view.html&id=$dataId'>Show my parameter set</a>";
}
else if(isset($_GET['submit']))
{
    echo json_encode($_SESSION['data']);
}
else if(isset($_POST['data']))
{
	header('Content-Type: text/html');

	//unset($_SESSION['data']);
	$_SESSION['data'] = json_decode($_POST['data']); //$_POST['data'];
	
	phpBBAuthenticate();
	
	header('Location: add.html');
}
else if(isset($_GET['questions']))
{
	$sql = "SELECT id, name, question FROM pd_metaitems WHERE question IS NOT NULL";
	$data = [];

	foreach ($sqlDrv->arrayQuery($sql) as $row)
	{
		$data += [$row['id'] => stripslashes($row['question'])];
	}
	
	echo json_encode($data);
}
else if(isset($_GET['mobile']))
{
	$QUERYLIMIT *= 3;

	$rows = $sqlDrv->arrayQuery("SELECT 
	        `d`.`id` AS `id`,
	        `m`.`metaitem` AS `metaitem`,
	        `m`.`value` AS `value`
	    FROM
	        (`pd_datasets` `d` JOIN `pd_metadata` `m`)
	    WHERE
	        (`d`.`metadata` = `m`.`setid`)  AND (`m`.`metaitem` IN (2 , 5, 6))  ORDER BY id ASC LIMIT $OFFSET, $QUERYLIMIT");
	$lastId = 0;
	$data = [];
	
	foreach ($rows as $row)
	{
		if ($lastId != $row['id'])
		{
			array_push($data, ['id' => intval($row['id'])]);
		}
		$data[sizeof($data)-1] += [$row['metaitem'] => $row['value']];

		$lastId = $row['id'];
	}
	
	echo json_encode($data);
}else{

	$sql = "SELECT id, name, value FROM pd_namedmetadata ";
	
	if(isset($_SESSION['filter']))
	{
		$sqlFilter = "SELECT DISTINCT id FROM pd_namedmetadata ";
		$index=0;
		foreach ($_SESSION['filter'] as $id => $value)
		{
			if($index == 0) {
				$sqlFilter .= "WHERE value LIKE '%" . $value . "%' ";
			}else{
				$sqlFilter .= "OR value LIKE '%" . $value . "%' ";
			}
			$index++;
		}
		$sqlFilter .= "LIMIT $OFFSET, $QUERYLIMIT";
		//echo $sqlFilter;

		$dataId = $sqlDrv->arrayQuery($sqlFilter);
		if(count($dataId) == 0) {
			die("{}");
		}else{
			$sql .= " WHERE id IN (" . implode(",", $dataId[0]) . ") ";
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

function phpBBAuthenticate()
{
    define('IN_PHPBB', true);
	$phpbb_root_path = (defined('PHPBB_ROOT_PATH')) ? PHPBB_ROOT_PATH : '../forum/';
	$phpEx = substr(strrchr(__FILE__, '.'), 1);
	include($phpbb_root_path . 'common.' . $phpEx);
	 
	// Start session management
	$user->session_begin();
	$auth->acl($user->data);
	$user->setup();
	$userId = $user->data['user_id'];

	if ($userId < 2)
	{
		die('You are not logged in, please <a href="https://openinverter.org/forum/ucp.php?mode=login&redirect=/parameters/add.html">login to the forum</a>, then try again.');
	}

	return $userId;
}

?>
