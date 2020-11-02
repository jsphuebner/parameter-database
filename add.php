<?php
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
	die('You are not logged in, please <a href="https://openinverter.org/forum/ucp.php?mode=login">login to the forum</a>, then try again.');
}

$request->enable_super_globals();
$data = $_POST['data'];
$parameters = json_decode($data);

if (isset($_POST['submit']))
{
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

	echo "Done. <a href='?page=showset&id=$dataId'>Show my parameter set</a>";
}
else
{
	$sql = "SELECT id, name, question FROM pd_metaitems WHERE question IS NOT NULL";
	echo "<form method='POST'>" . PHP_EOL;
	foreach ($sqlDrv->arrayQuery($sql) as $row)
	{
		$id = $row['id'];
		$q = $row['question'];
		
		echo "<label for='md$id'>$q</label><br>" . PHP_EOL;
		echo "<input type='text' id='md$id' name='md[$id]'/><br>" . PHP_EOL;
	}
	echo "<label for='notes'>Notes</label><br><textarea id='notes' name='notes'></textarea>" . PHP_EOL;
	echo "<input type='hidden' name='data' value='$data'><br>" . PHP_EOL;
	echo "<input name='submit' type='submit'>" . PHP_EOL;

	echo "</form><br>" . PHP_EOL;

	foreach ($parameters as $name => $attributes)
	{
		if ($attributes->isparam && $attributes->category != "Testing")
		{
			$value = $attributes->enums ? $attributes->enums[$attributes->value] : $attributes->value;
			echo "$name = $value<br>";
		}
	}
}
?>
