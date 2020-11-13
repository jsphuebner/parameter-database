function buildQuestionForm(json,form,filter,exclude)
{
    for(var index in json)
    {
        //console.log(json[index]);

        var fieldset = document.createElement('div');
        fieldset.className = 'form-group';

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
                    select.className = 'form-control mb-3';
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
                    group.className = 'form-check mb-3';

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
                    input.className = 'js-range-slider mb-3';
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
                    var input = document.createElement('input');
                    input.className = 'form-control mb-3';
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
                    fieldset.appendChild(input);
                }
            }
            break;
        }
        form.appendChild(fieldset);

        $('.js-range-slider').ionRangeSlider();
    }
}
