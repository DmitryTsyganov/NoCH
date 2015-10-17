
    function getCookie(name) {
          var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
          ));
          return matches ? decodeURIComponent(matches[1]) : undefined;
    } 
    function setCookie(name, value, options) {
                                  options = options || {};
                                  var expires = options.expires;                     
                                  if (typeof expires == "number" && expires) {
                                    var d = new Date();
                                    d.setTime(d.getTime() + expires * 1000);
                                    expires = options.expires = d;
                                  }
                                  if (expires && expires.toUTCString) {
                                    options.expires = expires.toUTCString();
                                  }
                                  value = encodeURIComponent(value);
                                  var updatedCookie = name + "=" + value;
                                  for (var propName in options) {
                                    updatedCookie += "; " + propName;
                                    var propValue = options[propName];
                                    if (propValue !== true) {
                                      updatedCookie += "=" + propValue;
                                    }
                                  }
                                  document.cookie = updatedCookie;
}


    function next(hide,show){
        _hide = "#help" + String(hide)
        _show = "#help" + String(show)
        document.getElementById("n"+ String(hide)).style.fontSize = "0px"
        $(_hide).hide(700);
        $("#n" + String(hide)).css("background-color","red");
        if (show != 0){
            $(_show).show(700);
        }
        else {
            setCookie("name", "eric", {
                expires: 100500
            });
        }

    }
    function dead(){

        location.reload()
    }


