var globalXHR = new XMLHttpRequest();

document.addEventListener("DOMContentLoaded", function(event)
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            //console.log(json);

			var table = document.getElementById('parameter-list');
            var tbody = document.createElement('tbody');

            var category = [];

    		for(var key in json)
	        {
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
                	//console.log(json[key].category);
                	category.push(json[key].category);

                	var row = document.createElement('tr');
                    row.className = 'text-light bg-secondary';
        			
                	var colspan = Object.keys(json[key]).length;
                	var col = document.createElement('td');
                	col.setAttribute('colspan', colspan);

                	var wrapper = document.createElement('div');
                    wrapper.className = 'form-check input-group-checkbox';

					var checkbox = document.createElement('input');
                    checkbox.className = 'form-check-input';
                    checkbox.setAttribute('type', 'checkbox');
                    checkbox.setAttribute('id', json[key].category);
                    checkbox.checked = true;
					wrapper.appendChild(checkbox);

					var label = document.createElement('label');
                    label.className = 'form-check-label';
                    label.textContent = json[key].category;
    				wrapper.appendChild(label);


                    col.appendChild(wrapper);
					row.appendChild(col);
					tbody.appendChild(row);
                }

                var row = document.createElement('tr');

             	var i = 0;
                for(var item in json[key])
			    {
			        //console.log(json[key][item]);
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

    var mxhr = new XMLHttpRequest();
    mxhr.responseType = 'json';
    mxhr.onload = function() {
        if (mxhr.status == 200) {
            var json = mxhr.response;
            console.log(json);

            var table = document.getElementById('parameter-metadata');
            var tbody = document.createElement('tbody');

            var keys = Object.keys(json);

            for (i = 0; i < keys.length; i++)
            {
                var row = document.createElement('tr');
      
                //console.log(keys);
                var col = document.createElement('td');

                if(keys[i] == 'Userid') {
                    var a = document.createElement('a');
                    a.setAttribute('href', 'https://openinverter.org/forum/memberlist.php?mode=viewprofile&u=' + json[keys[i]]);
                    a.textContent = 'User Profile';
                    col.appendChild(a);
                }else{
                    col.textContent = keys[i];
                }
                row.appendChild(col);

                var col = document.createElement('td');
                col.textContent = json[keys[i]];
                row.appendChild(col);
                
                tbody.appendChild(row);
            }
            table.appendChild(tbody);
        }
    };
    mxhr.open('GET', 'api.php?metadata&' + window.location.search.substr(1), true);
    mxhr.send();

    buildRating('rating', window.location.search.substr(1), true);
});

function cherryPick()
{
    var filter = '';

    var inputs = document.querySelectorAll("input[type='checkbox']");
    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].checked == true) {
            filter += ':' + inputs[i].id;
        }
    }
    return filter.substring(1);
}

function sendParameters(json, index, loop)
{
    //Requires Server to provide "Access-Control-Allow-Origin"

    var key = Object.keys(json)[index];
    var total =  Object.keys(json).length;
    
    if(key)
    {
    	var url = 'http://192.168.4.1/';
    	if(loop == 0) { //Original ESP Web-Interface
    		url += 'cmd?cmd=set '+ key + ' ' + json[key];
    	}else if(loop == 1) { //Alternative ESP Web-Interface
    		url += 'serial.php?set&name='+ key + '&value=' + json[key];
    	}else if(loop == 2) { //USB-TTL Web-Interface
			url = 'http://127.0.0.1:8080/serial.php?set&name='+ key + '&value=' + json[key];
    	}else{
 			var el = document.getElementById('inverter-error');
            el.style.display = 'block';
            el.textContent = "Connection Timed Out!";
            return;
    	}
        console.log(key + "=" + json[key]);

        globalXHR.timeout = 8000;
        globalXHR.onload = function() {
            if (globalXHR.status == 200) {
                document.getElementsByClassName('progress-bar')[0].style.width = (index/Object.keys(json).length*100) + '%';
                sendParameters(json, (index+1), loop);
            } else if (globalXHR.status == 404) {
				sendParameters(json, index, (loop+1));
            }
        }
        globalXHR.ontimeout = function () {
            sendParameters(json, index, (loop+1));
        }
        globalXHR.open('GET', url, true);
        globalXHR.send();
    }else{
        document.getElementsByClassName('progress-bar')[0].style.width = '100%';
        document.getElementById('inverter-success').style.display = 'block';

        var done = document.getElementById('inverter-status-button');
        done.classList.remove('cancel');
        done.textContent = 'Done';
        done.onclick = function(event){
            this.classList.add('cancel');
            this.textContent = 'Cancel';
            this.parentElement.parentElement.parentElement.parentElement.style.display = 'none';
        }
    }
}

function loadParameters()
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            //console.log(json);

            window.location.href = '#inverter-connect';
            var modal = document.getElementById('inverter-connect');
            modal.style.display = 'block';
            modal.onclick = function(event){
                if (event.target !== this)
                    return;
                this.style.display = 'none';
            }
            document.querySelector('.close').addEventListener('click', function(event) {
                //globalXHR.abort();
                modal.style.display = 'none';
                //window.location.href = '#';
            });
            document.querySelector('.cancel').addEventListener('click', function(event) {
                globalXHR.abort();
                var el = document.getElementById('inverter-error');
                el.style.display = 'block';
                el.textContent = "Parameter Loading Canceled!";
                //window.location.href = '#';
            });
            document.getElementsByClassName('progress-bar')[0].style.width = '0%';
            document.getElementById('inverter-error').style.display = 'none';
            document.getElementById('inverter-success').style.display = 'none';
            sendParameters(json, 0, 0);
        }
    };
    xhr.open('GET', 'api.php?' + window.location.search.substr(1) + '&download&filter=' + cherryPick(), true);
    xhr.send();
}

function downloadParameters()
{
    window.location.href = 'api.php?' + window.location.search.substr(1) + '&download&filter=' + cherryPick();
}