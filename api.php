<?php
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

	$QUERYLIMIT *= 11;

	$rows = $sqlDrv->arrayQuery("SELECT id, name, value FROM pd_namedmetadata ORDER BY id ASC LIMIT $OFFSET, $QUERYLIMIT");
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

?>
