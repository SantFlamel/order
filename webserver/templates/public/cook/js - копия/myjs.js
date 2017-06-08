function procCollapse() {
    document.navbar.style.maxHeight = "auto";
}
// Дата и время в интерфейс выставляется
function getTime() {
    var d = new Date();
    var month_num = d.getMonth();
    var day_num = d.getDay();
    var day = d.getDate();
    var hours = d.getHours();
    var minutes = d.getMinutes();

    var month = new Array( "января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря" );
    var weekday = new Array( "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" );

    if ( day <= 9 ) day = "0" + day;
    if ( hours <= 9 ) hours = "0" + hours;
    if ( minutes <= 9 ) minutes = "0" + minutes;

    var current_time = hours + ":" + minutes;
    var current_date = weekday[day_num] + ",  " + day + " " + month[month_num];
    if ( document.layers ) {
        document.layers.doc_time.document.write( current_time );
        document.layers.doc_date.document.write( current_date );
        document.layers.doc_time.document.close();
        document.layers.doc_date.document.close();
    } else {
        document.getElementById( "doc_time" ).innerHTML = current_time;
        document.getElementById( "doc_date" ).innerHTML = current_date;
    }
    setTimeout( "getTime()", 30000 );
}
getTime();


// Таймер на увеличение 

function startTimer() {

    var timers = $( "[data-role=timer]" );

    $.each( timers, function ( key, up_timer ) {
        timer( up_timer );
    } );

}
function timer( block ) {
    setInterval( function () {

        var d = new Date(),
            ah = d.getHours(),
            am = d.getMinutes(),
            as = d.getSeconds();

        var startTimeOrder = block.parentNode.firstElementChild.getAttribute( 'value' );
        //while (startTimeOrder.indexOf(":")!= 3)
        if ( startTimeOrder.length > 8 ) startTimeOrder = startTimeOrder.slice( 11, 19 ); //если время не в формате 00:00:00
        //console.log(startTimeOrder);

        //console.log(startTimeOrder);
        var bt = startTimeOrder.split( ":" ),
            bh = bt[0], bm = bt[1], bs = bt[2],
            ch = ah - bh, cm = am - bm, cs = as - bs;

        if ( cs < 0 ) {
            cs = cs + 60;
            cm = cm - 1;
        }
        if ( cs < 10 & cs >= 0 ) cs = "0" + cs;

        if ( cm < 0 ) {
            cm = cm + 60;
            ch = ch - 1;
        }
        if ( cm < 10 & cm >= 0 ) cm = "0" + cm;

        if ( ch < 0 ) ch = ch + 24;
        if ( ch < 10 & ch >= 0 ) ch = "0" + ch;


        var time = ch + ":" + cm + ":" + cs;
        time = timeMinus( time, SYSTIME );
        $( block ).text( time );
        //var time = block.innerHTML;

        // Ограничение времени передаем сюда
        // var limitTime = block.parentNode.lastElementChild.getAttribute('value');
        var limitTime = block.nextElementSibling.getAttribute( 'value' );
        if ( time >= limitTime ) {
            block.parentNode.setAttribute( 'class', 'col-xs-12 col-sm-4 styleDiv late' );
        }
        //   setTimeout("timer(block)", 1000);
    }, 1000 );
}
function downTimer() {
    var my_timer = $( "#in_work" );
    var time = my_timer.text();
    if ( time[0] == "-" ) {
        downTimerMinus1( my_timer );
        return;
    }
    var arr = time.split( ":" ), hd = arr[0], md = arr[1], sd = arr[2];
    if ( sd == 0 ) {
        if ( md == 0 ) {
            if ( hd == 0 ) {
                console.log( "Превышена норма времени" );
                my_timer.prepend( '-' );
                downTimerMinus1( my_timer );
                return;
            }
            hd--;
            md = 60;
            if ( hd < 10 ) hd = "0" + hd;
        }
        md--;
        if ( md < 10 ) md = "0" + md;
        sd = 59;
    }
    else sd--;
    if ( sd < 10 ) sd = "0" + sd;
        my_timer.text( hd + ":" + md + ":" + sd );
}
var timer_int;

function downTimerMinus1( my_timer ) {
    //  setInterval(function () {

    var time = my_timer.text();
    if ( time[0] == '-' ) time = time.slice( 1 );
    var arr = time.split( ":" ), hd = arr[0], md = arr[1], sd = arr[2];
    if ( sd == 59 ) {
        if ( md == 59 ) {
            hd++;
            md = 0;
            if ( hd < 10 ) hd = "0" + hd;
        }
        md++;
        sd = 0;
        if ( md < 10 ) md = "0" + md;
    }
    else sd++;
    if ( sd < 10 ) sd = "0" + sd;
    my_timer.text( "-" + hd + ":" + md + ":" + sd );
    // setTimeout(downTimerMinus1, 1000);
    //  }, 1000)
}
function downTimer2( my_timer ) {

    setInterval( function () {
        downTimer( my_timer );

        var time = my_timer.innerHTML;
        var id = my_timer.getAttribute( "label2" );
        //  console.log(id);
        var idi = my_timer.getAttribute( "label3" );
        var name = my_timer.getAttribute( "label" );

        var progress = my_timer.parentNode;
        var valuenow = progress.getAttribute( "aria-valuenow" );
        var valuemax = progress.getAttribute( "aria-valuemax" );
        if ( +valuenow <= +valuemax ) {
            valuenow = +valuenow + 1;
        }
        progress.setAttribute( "aria-valuenow", valuenow );
        progress.setAttribute( "style", "width: " + valuenow / valuemax * 100 + "%;" );
        var data = valuenow / valuemax * 100;
        if ( time[0] == "-" ) {
            addTimerFinishDiv( id, idi, name );
            delTimerProgressbar( my_timer );
            //downTimerMinus2(my_timer);
            return;
        }

    }, 1000 )


    //$(".lBlock").siblings(".cont")
    // найдет элементы класса cont,    role="progressbar"
    // которые имеют общих родителей, с элементами класса lBlock '[role="progressbar"]'

    // var progressval= progress.val();
    // progressval = progressval +1;

    //  $(progress).attr({"aria-valuenow": valuenow.html()});

    // $("div").attr({"class":"divEl", "title":"Див"})	класс div-элементов станет равен divEl, а title — "Див"
    //  $(".rool").attr("title")

}
function downTimerMinus2( my_timer ) {
    downTimerMinus1( my_timer );
}
// Запуск таймеров в карточке заказа
function startTimers() {
    //time_second ();
    //downTimer();
    //downTimer1();
    startTimer();
}





