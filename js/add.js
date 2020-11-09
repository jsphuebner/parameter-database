document.addEventListener("DOMContentLoaded", function(event)
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            console.log(json);

            var table = document.getElementById('parameter-data');
            var tbody = document.createElement('tbody');

	        var upload = document.getElementById('parameter-upload');

	    	var h = document.createElement('h2');
	    	h.textContent = 'Upload Parameters';
	    	upload.appendChild(h);

	       	var submit = document.createElement('input');
		    submit.setAttribute('type', 'file');
		    submit.setAttribute('name', 'data');
		    submit.setAttribute('accept', '.json');
			submit.textContent = 'Browse Parameter File';
			submit.onchange = function() {
				this.form.submit();
			}
			upload.appendChild(submit);

            if(Object.keys(json).length > 0)
            {
            	if(json['error'] == undefined)
            	{
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

	            	var qxhr = new XMLHttpRequest();
				    qxhr.responseType = 'json';
				    qxhr.onload = function() {
				        if (qxhr.status == 200) {
				            var json = qxhr.response;
				            console.log(json);

							var form = document.getElementById('parameter-questions');

							var h = document.createElement('h2');
					    	h.textContent = 'Questions';
					    	form.appendChild(h);

							buildQuestionForm(json,form, []);

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
				    qxhr.open('GET', 'api.php?questions', true);
				    qxhr.send();
				}else if(json['error'] == 'login') {
					upload.appendChild(buildLogin());
				}else{
					var error = document.createElement('div');
					error.className = 'bg-danger text-light mt-4';
					error.textContent = 'Upload Error. Requires full JSON output with categories. Snapshot files are not valid.';
					upload.appendChild(error);
				}
            }

            table.appendChild(tbody);
        }
    };
    xhr.open('GET', 'api.php?submit', true);
    xhr.send();
});