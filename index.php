<!doctype html>
<html>
<body>
<?php
$page = isset($_GET['page']) ? $_GET['page'] : "view";
require ('config.inc.php');

$sqlDrv->connect();

require ("$page.php");
?>
</body>
</html>
