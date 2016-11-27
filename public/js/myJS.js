 $(document).ready(function () {
        setInterval(function () {
            getTheLogs();
        }, 10000);
    });

function getCode() {
     $.ajax({
         type: "GET"
         , url: 'http://127.0.0.1:8080/action?action=getcode'
         , complete: function (data) {
            getTheLogs();
         }
     });
 }

function getTheLogs() {
     $.ajax({
         type: "GET"
         , url: 'http://127.0.0.1:8080/action?action=getlogs'
         , complete: function (data) {
             var items = JSON.parse(data.responseText);
             if (items.length > $('.logdiv')[0].children.length) {
                 
                 //$('.logdiv').children().last()[0].innerHTML.match('</span>(.*)')[1].match('-(.*)')[1];
                 $.playSound("/js/plop");
                 $('.logdiv').append(items[items.length-1]);
                 $('.logdiv').children().last().hide().slideDown("fast");
                 
             }
         }
     });
 }