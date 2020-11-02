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
	$metadata = $sqlDrv->mapQuery("SELECT name,value FROM pd_namedmetadata WHERE id=$id", "name");
	$data = $sqlDrv->arrayQuery("SELECT category, name, unit, value FROM pd_namedata WHERE setid=$id LIMIT $OFFSET, $QUERYLIMIT");

	echo json_encode(array_merge($metadata,$data));

}else{

	$rows = $sqlDrv->arrayQuery("SELECT id, name, value FROM pd_namedmetadata LIMIT $OFFSET, $QUERYLIMIT");

	echo json_encode($rows);
}

?>
