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
			        	if(header != 'id') {
		        			//console.log(header);
			        		var col = document.createElement('th');
        					col.textContent = header;
                            row.appendChild(col);
						}
			        }

                    var col = document.createElement('th');
                    col.textContent = 'Rating';
                    row.appendChild(col);

			        table.appendChild(row);
                }

                var row = document.createElement('tr');

        		var i = 0;
                for(var item in json[key])
			    {
			        console.log(json[key][item]);
                    if(item != 'id') {
    			        var col = document.createElement('td');
    			        if(i == 2) {
    			        	var a = document.createElement('a');
    			        	a.setAttribute('href', 'view.html?id=' + json[key]['id']);
    			        	a.textContent = json[key][item];
    			        	col.appendChild(a);
    			        }else{
            				col.textContent = json[key][item];
    					}
    					row.appendChild(col);
                    }
					i++;
			    }

                var col = document.createElement('td');
                col.setAttribute('id', 'rating-' + key);
                col.className = 'rating';
                row.appendChild(col);

			    tbody.appendChild(row);

                buildRating('rating-' + key, 'id=' + json[key]['id'], false);
	        }
	        table.appendChild(tbody);

            buildPages();
        }
    };
    xhr.open('GET', 'api.php?' + window.location.search.substr(1), true);
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

                    buildQuestionForm(JSON.parse('[{"1":"Firmware Version?","type":"select","options":"Sine,FOC"},{"3":"Hardware Variant?","type":"select","options":"Rev1,Rev2,Rev3,Tesla,TeslaM3,BluePill,Prius"}]'), form, filter);

                    buildQuestionForm(json, form, filter);

                    var submit = document.createElement('button');
                    submit.setAttribute('type', 'submit');
                    submit.setAttribute('name', 'filter');
                    submit.className = 'btn btn-primary';
                    submit.textContent = 'Filter Results';
                    form.appendChild(submit);

                    var coll = document.getElementsByClassName('collapsible')[0];
                    var content = document.getElementById('collapsible-content');
                    if(filter != null) {
                        content.classList.remove('hidden');
                    }
                    coll.addEventListener('click', function() {
                        this.classList.toggle('active');
                        content.classList.toggle('hidden');
                    });
                }
            };
            ffxhr.open('GET', 'api.php?filter', true);
            ffxhr.send();
        }
    };
    fxhr.open('GET', 'api.php?questions', true);
    fxhr.send();
});

function buildPages()
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            //console.log(json);

            if(Object.keys(json).length > 0)
            {
                var pages = document.getElementById('pages');

                var first = document.createElement('button');
                first.className = 'btn btn-primary btn-sm mr-3';
                first.textContent = '<';
                first.onclick = function(event) {
                    location.href = '?offset=0';
                }
                pages.appendChild(first);

                for (var i = 0; i < json['pages']; i++)
                {
                    var pg = document.createElement('button');
                    pg.className = 'btn btn-primary btn-sm mr-3';
                    pg.setAttribute('id', i);
                    pg.textContent = i + 1;
                    pg.onclick = function(event) {
                        var o = (json['offset'] * this.id);
                        location.href = '?offset=' + o;
                    }
                    pages.appendChild(pg);
                }

                var last = document.createElement('button');
                last.className = 'btn btn-primary btn-sm mr-3';
                last.textContent = '>';
                last.onclick = function(event) {
                    var o = (json['offset'] * json['pages']);
                    location.href = '?offset=' + o;
                }
                pages.appendChild(last);
            }
        }
    };
    xhr.open('GET', 'api.php?pages', true);
    xhr.send();
}