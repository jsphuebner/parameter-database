document.addEventListener("DOMContentLoaded", function(event)
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            //console.log(json);

			var table = document.getElementById('database-list');
            var tbody = document.createElement('tbody');

            var category = [];

    		for(var key in json)
	        {
                //if(!category.includes(json[key].category)) //create table header
                if(key == 0) //create table header
                {
        			var row = document.createElement('thead');
        			row.className = 'thead-inverse';

                	for(var header in json[key])
			        {
		        		var col = document.createElement('th');
    					col.textContent = header;
						row.appendChild(col);
			        }
			        table.appendChild(row);
                }

                if(!category.includes(json[key].category)) //create table header
                {
                	console.log(json[key].category);
                	category.push(json[key].category);

                	var row = document.createElement('tr');
                    row.className = 'text-light bg-secondary';
        			
                	var colspan = Object.keys(json[key]).length;
                	var col = document.createElement('td');
                	col.setAttribute('colspan', colspan);
					col.textContent = json[key].category;

					row.appendChild(col);
					tbody.appendChild(row);
                }

                var row = document.createElement('tr');

             	var i = 0;
                for(var item in json[key])
			    {
			        console.log(json[key][item]);
			        var col = document.createElement('td');
			        if(i > 0) {
        				col.textContent = json[key][item];
					}
					row.appendChild(col);
					i++;
			    }
			   	tbody.appendChild(row);
	        }
	         
			table.appendChild(tbody);
        }
    };
    xhr.open('GET', 'api.php?' + window.location.search.substr(1), true);
    xhr.send();
});