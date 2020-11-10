document.addEventListener("DOMContentLoaded", function(event)
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            //console.log(json);

			var table = document.getElementById('database-my-subcsribers');
            var tbody = document.createElement('tbody');

            if(Object.keys(json).length == 0)
            {
                var row = document.createElement('tr');
                var col = document.createElement('td');
                col.textContent = "No Subscribers";
                row.appendChild(col);
                tbody.appendChild(row);
            }

            if(json['error'] == undefined) {
	    		for(var key in json) {
		            //console.log(key);
	                if(key == 0) //create table header
	                {
	        			var row = document.createElement('thead');
	        			row.className = 'thead-inverse';

	                	for(var header in json[key])
				        {
		        			//console.log(header);
		        			var col = document.createElement('th');
    						col.textContent = header;
							row.appendChild(col);
				        }
				        table.appendChild(row);
	                }

	                var row = document.createElement('tr');
	                for(var item in json[key])
				    {
				        //console.log(item);
			        	var col = document.createElement('td');
			        	if(item =='token') {
	        				var a = document.createElement('a');
				        	a.setAttribute('href', 'api.php?token=' + json[key][item]);
				        	a.textContent = json[key][item];
				        	col.appendChild(a);
	        			}else{
	        				col.textContent = json[key][item];
	        			}
	        			row.appendChild(col);
				    }
				    tbody.appendChild(row);
		        }
		        buildPages();
	        }else{
                tbody.appendChild(buildLogin());
            }
            table.appendChild(tbody);
        }
    };
    xhr.open('GET', 'api.php?subscribers&' + window.location.search.substr(1), true);
    xhr.send();
});