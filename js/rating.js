function buildRating()
{
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status == 200) {
            var json = xhr.response;
            //console.log(json);
            
            var div = document.getElementsByClassName('rating');
            var rating = document.createElement('div');

            var ratingIndex = 0;
            if(json["rating"] != null) {
                ratingIndex = parseInt(json["rating"]);
                rating.innerHTML = '(' + json["count"] + ') ' + json["rating"] + '/5';
            }else{
                rating.innerHTML = '(Not Rated)';
            }

            div[0].appendChild(rating);

            for (var i = 5; i >= 1; i--) {
                var star = document.createElement('span');
                star.setAttribute('id', i);
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
                                    var s = document.getElementById(i);
                                    if(ratingIndex >= i) {
                                        s.innerHTML = '&#9733;'
                                    }else{
                                        s.innerHTML = '&#9734;'
                                    }
                                }
                                rating.innerHTML = '(' + json["count"] + ') ' + json["rating"] + '/5';
                            }
                        }
                    };
                    sxhr.open('GET', 'api.php?rating=' + this.id + '&' + window.location.search.substr(1), true);
                    sxhr.send();
                };
                div[0].appendChild(star);
            }
        }
    };
    xhr.open('GET', 'api.php?rating&' + window.location.search.substr(1), true);
    xhr.send();
}