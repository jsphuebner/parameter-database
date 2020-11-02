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

    		for(var key in json)
	        {
	            //console.log(key);

                if(key == 0) //create table header
                {
        			var row = document.createElement('thead');
        			row.className = 'thead-inverse';

                	for(var header in json[key])
			        {
			        	//if(header != 'id') {
		        			//console.log(header);
			        		var col = document.createElement('th');
        					col.textContent = header;
						//}
						row.appendChild(col);
			        }
			        table.appendChild(row);
                }

                var row = document.createElement('tr');

        		var i = 0;
                for(var item in json[key])
			    {
			        console.log(json[key][item]);
			        var col = document.createElement('td');
			        if(i == 0) {
			        	var a = document.createElement('a');
			        	a.setAttribute('href', 'view.html?id=' + json[key][item]);
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
        }
    };
    xhr.open('GET', 'api.php', true);
    xhr.send();

    var fxhr = new XMLHttpRequest();
    fxhr.responseType = 'json';
    fxhr.onload = function() {
        if (fxhr.status == 200) {
            var json = fxhr.response;
            //console.log(json);

            var ffxhr = new XMLHttpRequest();
            ffxhr.responseType = 'json';
            ffxhr.onload = function() {
                if (ffxhr.status == 200) {
                    var filter = ffxhr.response;
                    //console.log(filter);

                    var form = document.getElementById('database-filter');
                    for(var key in json)
                    {
                        console.log(key);
                
                        var fieldset = document.createElement('div');
                        fieldset.className = 'form-group';

                        var input = document.createElement('input');
                        input.className = 'form-control mb-3';
                        input.setAttribute('type', 'text');
                        input.setAttribute('name', 'md[' + key + "]");
                        input.setAttribute('id', 'md' + key);
                        input.setAttribute('placeholder', json[key]);
                        if(filter[key] != undefined) {
                            input.setAttribute('value', filter[key]);
                        }
                        fieldset.appendChild(input);
                        form.appendChild(fieldset);
                    }

                    var submit = document.createElement('button');
                    submit.setAttribute('type', 'submit');
                    submit.setAttribute('name', 'filter');
                    submit.className = 'btn btn-primary';
                    submit.textContent = 'Filter Results';
                    form.appendChild(submit);
                }
            };
            ffxhr.open('GET', 'api.php?filter=1', true);
            ffxhr.send();
        }
    };
    fxhr.open('GET', 'api.php?questions=1', true);
    fxhr.send();
});