function buildQuestionForm(json,form,filter,exclude)
{
    for(var index in json)
    {
        //console.log(json[index]);

        var fieldset = document.createElement('div');
        fieldset.className = 'form-group mb-3';

        for(var key in json[index])
        {
            console.log(key);
            
            if(!exclude.includes(parseInt(key)))
            {
                if(json[index]['type'] === 'select')
                {
                    var label = document.createElement('div');
                    label.className = 'form-label';
                    label.textContent = json[index][key];
                    form.appendChild(label);

                    var select = document.createElement('select');
                    select.className = 'form-control';
                    select.setAttribute('name', 'md[' + key + "]");
                    select.setAttribute('id', 'md' + key);

                    var option = document.createElement('option');
                    select.appendChild(option);

                    var i = 1;
                    json[index]['options'].split(',').forEach(function (item) {
                        var option = document.createElement('option');
                        option.setAttribute('value', item);
                        option.textContent = item;
                        select.appendChild(option);
                        if(filter != undefined){
                            if (filter[key] === item)
                                select.selectedIndex = i;
                        }else{
                        	select.setAttribute('required', true);
                        }
                        i++;
                    });
                
                    fieldset.appendChild(select);
                }
                else if(json[index]['type'] === 'checkbox')
                {
                    var group = document.createElement('div');
                    group.className = 'form-check';

                    var label = document.createElement('div');
                    label.className = 'form-label';
                    label.textContent = json[index][key];
                    form.appendChild(label);

                    var input = document.createElement('input');
                    input.setAttribute('type', 'hidden');
                    input.setAttribute('name', 'md[' + key + "]");
                    input.setAttribute('id', 'md' + key);
                    if(filter != undefined)
                        input.setAttribute('value', (filter[key] || ''));
                    fieldset.appendChild(input);
                    
                    json[index]['options'].split(',').forEach(function (item) {

                        var wrapper = document.createElement('div');
                        wrapper.className = 'input-group-checkbox';
                        
                        var checkbox = document.createElement('input');
                        checkbox.className = 'form-check-input';
                        checkbox.setAttribute('type', 'checkbox');
                        checkbox.setAttribute('id', '_md' + key);
                        checkbox.value = item;
                        if(filter != undefined && filter[key] != undefined) {
                        	if (filter[key].indexOf(item) !== -1)
                            	checkbox.checked = true;
                        }else if(json[index]['value'] != null) {
                            if (json[index]['value'].indexOf(item) !=-1)
                                checkbox.checked = true;
                        }

                        checkbox.onclick = function()
                        {
                        	var h = document.getElementById(this.id.substring(1));
                        	if(this.checked) {
                        		h.value += ',' + item;
                        	}else{
                        		h.value = h.value.replace(',' + this.value, '');
                        		h.value = h.value.replace(this.value + ',', '');
                        		h.value = h.value.replace(this.value, '');
                        	}
                        	if(h.value.charAt(0) === ',')
    							h.value = h.value.substring(1);
                        	//console.log(h.value);
    					};

                        var label = document.createElement('label');
                        label.className = 'form-check-label';
                        label.textContent = item;

                        wrapper.appendChild(checkbox);
                        wrapper.appendChild(label);

                        group.appendChild(wrapper);
                    });
                    fieldset.appendChild(group);
                }
                else if(json[index]['type'] === 'slider')
                {
                    var label = document.createElement('div');
                    label.className = 'form-label';
                    label.textContent = json[index][key];
                    form.appendChild(label);

                    var s = json[index]['options'].split('-');

                    var input = document.createElement('input');
                    input.className = 'js-range-slider';
                    input.setAttribute('type', 'text');
                    input.setAttribute('name', 'md[' + key + "]");
                    input.setAttribute('id', 'md' + key);
                    input.setAttribute('data-skin', 'big');
                    input.setAttribute('data-min', 0);
                    input.setAttribute('data-max', s[1]);
                    input.setAttribute('data-step', 1);
                    input.setAttribute('data-grid', true);
                    if(filter != undefined) {
                        input.setAttribute('data-from', (filter[key] || 0));
                        input.setAttribute('value', (filter[key] || ''));
                    }else if(json[index]['value'] != null) {
                        input.setAttribute('data-from', json[index]['value']);
                        input.setAttribute('value', json[index]['value']);
                    }
                    fieldset.appendChild(input);
                }else if(json[index]['type'] === 'text'){

                    fieldset.classList.add('autocomplete');

                    var input = document.createElement('input');
                    input.className = 'form-control';
                    input.setAttribute('type', json[index]['type']);
                    input.setAttribute('name', 'md[' + key + "]");
                    input.setAttribute('id', 'md' + key);
                    input.setAttribute('placeholder', json[index][key]);
                    if(filter != undefined) {
                        input.setAttribute('value', (filter[key] || ''));
                    }else{
                    	if(json[index]['value'] != null)
                        	input.setAttribute('value', json[index]['value']);
                    	input.setAttribute('required', true);
                    }
                    autocomplete(input, key);

                    fieldset.appendChild(input);
                }
            }
            break;
        }
        form.appendChild(fieldset);

        $('.js-range-slider').ionRangeSlider();
    }
}

//https://www.w3schools.com/howto/howto_js_autocomplete.asp
function autocomplete(inp, id)
{
    var currentFocus;
    var delayLookup;

    inp.addEventListener('input', function(e) {
        var a, b, i, val = this.value;

        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;

        //Delay - fast typers DOS
        clearTimeout(delayLookup);
        delayLookup = setTimeout(function() {
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'json';
            xhr.onload = function() {
                if (xhr.status == 200) {
                    
                    a = document.createElement('div');
                    a.setAttribute('id', inp.id + 'autocomplete-list');
                    a.setAttribute('class', 'autocomplete-items');
                    inp.parentNode.appendChild(a);

                    var arr = json2array(xhr.response);
                    for (i = 0; i < arr.length; i++) {
                        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                            var b = document.createElement('div');
                            b.innerHTML = '<strong>' + arr[i].substr(0, val.length) + '</strong>';
                            b.innerHTML += arr[i].substr(val.length);
                            b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                            b.addEventListener('click', function(e) {
                                inp.value = this.getElementsByTagName('input')[0].value;
                                closeAllLists();
                          });
                          a.appendChild(b);
                        }
                    }
                }
            };
            xhr.open('GET', 'api.php?autocomplete=' + val + '&id=' + id, true);
            xhr.send();
        }, 800);
      });
      inp.addEventListener('keydown', function(e) {
          var x = document.getElementById(this.id + 'autocomplete-list');
          if (x) x = x.getElementsByTagName('div');
          if (e.keyCode == 40) { //down
            currentFocus++;
            addActive(x);
          } else if (e.keyCode == 38) { //up
            currentFocus--;
            addActive(x);
          } else if (e.keyCode == 13) { //enter
            e.preventDefault();
            if (currentFocus > -1) {
              if (x) x[currentFocus].click();
            }
          }
      });
      function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add('autocomplete-active');
      }
      function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
          x[i].classList.remove('autocomplete-active');
        }
      }
      function closeAllLists(elmnt) {
        var x = document.getElementsByClassName('autocomplete-items');
        for (var i = 0; i < x.length; i++) {
          if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
    document.addEventListener('click', function (e) {
        closeAllLists(e.target);
    });
}

function json2array(json){
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function(key){
        result.push(json[key]);
    });
    return result;
}
