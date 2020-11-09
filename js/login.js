function buildLogin()
{
    var login = document.createElement('div');
    login.innerHTML = 'You are not logged in, please <a href="https://openinverter.org/forum/ucp.php?mode=login&redirect=/parameters/my.html">login to the forum</a>';
    return login;
}