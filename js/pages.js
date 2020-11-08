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