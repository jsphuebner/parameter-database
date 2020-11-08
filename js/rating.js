function buildRating(element, id, showStatistics)
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            //console.log(json);
            var ratingIndex = json["rating"] || 0;
            var div = document.getElementById(element);
            var rating = document.createElement('div');

            if(showStatistics) {
                if(json["rating"] != null) {
                    rating.innerHTML = '(' + json["count"] + ') ' + json["rating"] + '/5';
                }else{
                    rating.innerHTML = '(Not Rated)';
                }
                div.appendChild(rating);
            }

            for (var i = 5; i >= 1; i--) {
                var star = document.createElement('span');
                star.setAttribute('id', element + '_' + i);
                if(ratingIndex >= i) {
                    star.innerHTML = '&#9733;'
                }else{
                    star.innerHTML = '&#9734;'
                }
                star.onclick = function() {
                    //console.log(this.id);
                    var sxhr = new XMLHttpRequest();
                    sxhr.responseType = 'json';
                    sxhr.onload = function() {
                        if (sxhr.status == 200) {
                            var json = sxhr.response;
                            //console.log(json);
                            if(json["rating"] == -1) {
                                alert("Cannot Vote Twice!");
                            }else{
                                ratingIndex = parseInt(json["rating"]);
                                for (var i = 1; i <= 5; i++) {
                                    var s = document.getElementById(element + '_' + i);
                                    if(ratingIndex >= i) {
                                        s.innerHTML = '&#9733;'
                                    }else{
                                        s.innerHTML = '&#9734;'
                                    }
                                }
                                if(showStatistics)
                                    rating.innerHTML = '(' + json["count"] + ') ' + json["rating"] + '/5';
                            }
                        }
                    };
                    sxhr.open('GET', 'api.php?rating=' + this.id.split('_')[1] + '&' + id, true);
                    sxhr.send();
                };
                div.appendChild(star);
            }
        }
    };
    xhr.open('GET', 'api.php?rating&' + id, true);
    xhr.send();
}