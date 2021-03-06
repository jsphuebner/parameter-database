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
			 	var intVal = parseInt(json[key]['value']);
			 	
			 	if (json[key]['enum'])
			 	{
				 	json[key]['unit'] = "";
				 	
				 	if (json[key]['enum'][intVal])
				 	{
				 		json[key]['value'] = json[key]['enum'][intVal];
				 	}
					else
					{
						json[key]['value'] = "";
						for (var key2 in json[key]['enum'])
 						{
							if (intVal & key2)
								json[key]['value'] += "+" + json[key]['enum'][key2];
						}
					}
			 	}
			 	delete json[key]['enum'];

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
					
					if(i > 0 && item != 'enum') {
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
				//console.log(json);

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
					 col.innerHTML = json[keys[i]];
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

function sendParametersTimedOut(msg)
{
    setTimeout(function(){
         document.getElementById('inverter-status').style.display = 'none';
    var el = document.getElementById('inverter-error');
         el.style.display = 'block';
         el.textContent = msg;
    }, globalXHR.timeout);
}

function sendParameters(json, index, loop)
{
	 //Requires Server to provide "Access-Control-Allow-Origin"

	 var key = Object.keys(json)[index];
	 var total =  Object.keys(json).length;
	 
	 if(key)
	 {
	 	document.getElementById('inverter-status').style.display = 'block';

	 	var url = 'http://192.168.4.1/';
        var url_cross_origin_test = 'http://192.168.4.1/refresh.png';
	 	if(loop == 0) { //Original ESP Web-Interface
	 		url += 'cmd?cmd=set '+ key + ' ' + json[key];
				document.getElementById('inverter-status-text').textContent = 'Connecting to ESP8266 ...';
	 	}else if(loop == 1) { //Alternative ESP Web-Interface
	 		url += 'serial.php?set&name='+ key + '&value=' + json[key];
				document.getElementById('inverter-status-text').textContent = 'Trying "Alternative" Web-Interface ...';
	 	}else if(loop == 2) { //USB-TTL Web-Interface
			url = 'http://127.0.0.1:8080/serial.php?set&name='+ key + '&value=' + json[key];
				document.getElementById('inverter-status-text').textContent = 'Trying USB-TTL Web-Interface ...';
	 	}else{
            sendParametersTimedOut('Connection Timed Out!');
			return;
	 	}
        console.log(key + "=" + json[key]);

        globalXHR.timeout = 6000;
        globalXHR.onload = function() {
        	if (globalXHR.status == 200) {
        		 document.getElementsByClassName('progress-bar')[0].style.width = (index/Object.keys(json).length*100) + '%';
        		 document.getElementById('inverter-status').style.display = 'none';
        		 sendParameters(json, (index+1), loop);
        	} else if (globalXHR.status == 404) {
        	sendParameters(json, 0, (loop+1));
        	}
        }
        globalXHR.onerror = function () {
            //Cross-Origin Detection (javascript works with images only)
            var img = document.createElement('img');
            img.onerror = function(args) {
                console.log('Connection Error', args);
                sendParameters(json, 0, (loop+1));
            }
            img.onload = function() {
                sendParametersTimedOut('Cross-Origin Blocked! - Update ESP8266 Firmware');
            }
            img.src = url_cross_origin_test;
        }
        globalXHR.ontimeout = function () {
        sendParameters(json, 0, (loop+1));
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

				var modal = document.getElementById('inverter-connect');
				modal.style.display = 'block';
				modal.onclick = function(event){
					if (event.target !== this)
						return;
					this.style.display = 'none';
				}
				document.querySelector('.close').addEventListener('click', function(event) {
					 globalXHR.abort();
					 modal.style.display = 'none';
				});
				document.querySelector('.cancel').addEventListener('click', function(event) {
					globalXHR.abort();
					var el = document.getElementById('inverter-error');
					el.style.display = 'block';
					el.textContent = "Parameter Loading Canceled!";
					document.getElementById('inverter-status').style.display = 'none';
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

function subscribeParameters()
{
	document.getElementById('inverter-subscribe-success').style.display = 'none';

	var modal = document.getElementById('inverter-subscribe');
	modal.style.display = 'block';
	modal.onclick = function(event) {
		this.style.display = 'none';
	}
	document.querySelector('.close').addEventListener('click', function(event) {
		modal.style.display = 'none';
	});

	var guid = create_UUID();
	var token = document.getElementById('inverter-subscribe-token');
	token.setAttribute('value', guid);
	token.onclick = function(event) {
		
		if (event.stopPropagation) {
			event.stopPropagation();
	   	}else if(window.event) {
			window.event.cancelBubble=true;
	   	}

		var xhr = new XMLHttpRequest();
		xhr.responseType = 'json';
		xhr.onload = function() {
			if (xhr.status == 200) {
				var json = xhr.response;
				console.log(json);
			}
		};
		xhr.open('GET', 'api.php?subscribe&' + window.location.search.substr(1) + '&token=' + guid + '&filter=' + cherryPick(), true);
		xhr.send();
	   	
		this.select();
		document.execCommand('copy');
		document.getElementById('inverter-subscribe-success').style.display = 'block';
	}
}

function downloadParameters()
{
	window.location.href = 'api.php?' + window.location.search.substr(1) + '&download&filter=' + cherryPick();
}

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}
