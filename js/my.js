document.addEventListener("DOMContentLoaded", function(event)
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            //console.log(json);

			var table = document.getElementById('database-my-list');
            var tbody = document.createElement('tbody');

            if(Object.keys(json).length == 0)
            {
                var row = document.createElement('tr');
                var col = document.createElement('td');
                col.textContent = "No Results";
                row.appendChild(col);
                tbody.appendChild(row);
            }

    		for(var key in json)
	        {
	            //console.log(key);

                if(key == 0) //create table header
                {
        			var row = document.createElement('thead');
        			row.className = 'thead-inverse';

                	for(var header in json[key])
			        {
	        			//console.log(header);
		        		var col = document.createElement('th');
		        		if(header != 'id') {
    						col.textContent = header;
    					}
						row.appendChild(col);
			        }
			        table.appendChild(row);
                }

                var row = document.createElement('tr');

        		var i = 0;
        		var id = 0;
                for(var item in json[key])
			    {
			        console.log(json[key][item]);
			        var col = document.createElement('td');
			        if(i == 0) {
			        	id = json[key][item];

			        	var d = document.createElement('button');
			        	d.className = 'btn btn-danger btn-sm';
			        	d.setAttribute('title', 'Delete');
			        	d.setAttribute('onclick', 'window.location.href="api.php?remove&id=' + id + '"');
			        	d.textContent = 'X';
			        	col.appendChild(d);
			        }else if(i == 2) {
			        	var a = document.createElement('a');
			        	a.setAttribute('href', 'view.html?id=' + id);
			        	a.textContent = json[key][item];
			        	col.appendChild(a);
			        }else{
        				col.textContent = json[key][item];
					}
					row.appendChild(col);
					i++;
			    }
			    tbody.appendChild(row);
	        }
	        table.appendChild(tbody);

	        buildPages();
        }
    };
    xhr.open('GET', 'api.php?&my=list', true);
    xhr.send();
});