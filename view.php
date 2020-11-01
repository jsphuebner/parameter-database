<table border=1>
<thead><tr><th>View</th>
<?php

$columns = $sqlDrv->mapQuery("SELECT id, name FROM pd_metaitems", "id");

foreach ($columns as $id => $name)
{
	echo "<th>$name</th>";
}
?>
</tr>
</thead>
<tbody>
<?php
$rows = $sqlDrv->arrayQuery("SELECT id, name, value FROM pd_namedmetadata");
$lastId = 0;

foreach ($rows as $row)
{
	$id = $row['id'];
	if ($lastId != $id)
	{		
		if ($lastId != 0) echo "</tr>";
		echo "<tr><td><a href='?page=showset&id=$id'>View</a></td>";
	}
	echo "<td>" . $row['value'] . "</td>";
	
	$lastId = $row['id'];
}
?>
</tbody>
</table>

