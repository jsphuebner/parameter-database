document.addEventListener("DOMContentLoaded", function(event)
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            console.log(json);

			var form = document.getElementById('parameter-questions');

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
    			fieldset.appendChild(input);
    			form.appendChild(fieldset);
	        }

	        var fieldset = document.createElement('div');
            fieldset.className = 'form-group';
			var textarea = document.createElement('textarea');
			textarea.className = 'form-control mb-3';
            textarea.setAttribute('name', 'notes');
            textarea.setAttribute('id', 'notes');
            textarea.setAttribute('placeholder', 'Notes');
			//textarea.style = 'min-width: 100%';
    		fieldset.appendChild(textarea);
    		form.appendChild(fieldset);

    		var submit = document.createElement('button');
            submit.setAttribute('type', 'submit');
            submit.setAttribute('name', 'submit');
			submit.className = 'btn btn-primary';
			submit.textContent = 'Submit Query';
			form.appendChild(submit);
        }
    };
    xhr.open('GET', 'api.php?questions=1', true);
    xhr.send();

    var dxhr = new XMLHttpRequest();
    dxhr.responseType = 'json';
    dxhr.onload = function() {
        if (dxhr.status == 200) {
            var json = dxhr.response;
            console.log(json);

            var table = document.getElementById('parameter-data');
            var tbody = document.createElement('tbody');
            var category = [];
            var t = 0;

            for(var key in json)
            {
                if(t == 0)
                {
                    var row = document.createElement('thead');
                    row.className = 'thead-inverse';

                    var col = document.createElement('th');
                    col.textContent = 'parameter';
                    row.appendChild(col);

                    colspan = Object.keys(json[key]);
                    for (i = 1; i < colspan.length-2; i++)
                    {
                        var col = document.createElement('th');
                        col.textContent = colspan[i];
                        row.appendChild(col);
                    }

                    var col = document.createElement('th');
                    col.textContent = colspan[0];
                    row.appendChild(col);

                    table.appendChild(row);
                }
                
                if(!category.includes(json[key].category)) //create table header
                {
                    //console.log(json[key].category);
                    if(json[key].category != undefined)
                    {
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
                }
                
                var row = document.createElement('tr');
                if(json[key].category != undefined)
                {
                    var col = document.createElement('td');
                    col.textContent = key;
                    row.appendChild(col);

                    colspan = Object.keys(json[key]);
                    for (i = 1; i < colspan.length-2; i++)
                    {
                        var col = document.createElement('td');
                        col.textContent = json[key][colspan[i]];
                        row.appendChild(col);
                    }

                    var col = document.createElement('td');
                    col.textContent = json[key][colspan[0]];
                    row.appendChild(col);
                }
                tbody.appendChild(row);
                
                t++;
            }
             
            table.appendChild(tbody);
        }
    };
    dxhr.open('GET', 'api.php?submit=1', true);
    dxhr.send();
});