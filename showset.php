<?php

$id = $_GET['id'];
$metadata = $sqlDrv->mapQuery("SELECT name,value FROM pd_namedmetadata WHERE id=$id", "name");
$notes = $sqlDrv->scalarQuery("SELECT notes from pd_datasets WHERE id=$id");
$notes = str_replace("\n", "<br>\n", $notes);

foreach ($metadata as $name => $value)
{
	if ($name == "Userid")
	{
		echo "Submitted by: <a href='https://openinverter.org/forum/memberlist.php?mode=viewprofile&u=$value'>User Profile</a><br>";
	}
	else
	{
		echo "$name = $value<br>";
	}
}
echo "<h3>Notes</h3>";
echo "<p>$notes";
?>
<hr>
<table border=1>
<thead>
<tr><th>Category</th><th>Name</th><th>Value</th></tr>
</thead>
<tbody>
<?php
$data = $sqlDrv->arrayQuery("SELECT category, name, unit, value FROM pd_namedata WHERE setid=$id");
$lastCategory = "";
foreach ($data as $item)
{
	$category = $item['category'];
	if ($category != $lastCategory)
	{
		echo "<tr><td colspan=3>$category</td></tr>" . PHP_EOL;
		$lastCategory = $category;
	}
	$name = $item['name'];
	$unit = $item['unit'];
	$value = $item['value'];
	
	echo "<tr><td>&nbsp;</td><td>$name</td><td>$value</td></tr>" . PHP_EOL;
}
?>
</tbody>
</table>
