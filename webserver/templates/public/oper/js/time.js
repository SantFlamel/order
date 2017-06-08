/**
 * Created by ALEX on 22.02.2017.
 */

function timeMinus( a, b, c ) {
    //c==0 для минусового таймера возвращает минус значение
    //с==1 плюсует 24 часа при переходе через 0
    //c==2 возвращает разницу в секундах
    var arr = a.split( ':' );
    var brr = b.split( ':' );
    // if (c==2) return arr[2]+arr[1]*60 +arr[0]*60*24;
    // if (a.day < b.day) arr[0]= brr[0]+1
    // if (a.day > b.day) arr[1]+=24; переход через 24 часа
    if ( arr[0] < brr[0] && c == 0 ) return '-' + (timeMinus( b, a, c ));
    else if ( arr[1] < brr[1] && arr[0] == brr[0] && c == 0 )return '-' + (timeMinus( b, a, c ));
    else if ( arr[1] == brr[1] && arr[2] <= brr[2] && c == 0 ) return '-' + (timeMinus( b, a, c ));
    if ( arr[0] < brr[0] ) arr[0] = +arr[0] + 24; //переход через 24 часа
    for ( var i = arr.length - 1; i >= 0; i-- ) {
        if ( arr[i] >= brr[i] ) arr[i] -= brr[i];
        else {
            if ( i > 0 ) {
                arr[i] = arr[i] - brr[i] + 60;
                --arr[i - 1];
            } else arr[i] = arr[i] - brr[i] + 24
        }
        if ( +arr[i] <= 9 ) arr[i] = "0" + +arr[i];
    }
    if ( c == 2 ) {
        return +arr[2] + +arr[1] * 60 + +arr[0] * 60 * 24;
    }
    return arr[0] + ":" + arr[1];
}

function timePlus( a, b ) {
    var arr = a.split( ':' );
    var brr = b.split( ':' );
    // if (a.day < b.day) arr[0]= brr[0]+1
    // if (a.day > b.day) arr[1]+=24; переход через 24 часа
    //if (arr[0]<brr[0]) arr[0]= +arr[0]+24; //переход через 24 часа
    for ( var i = arr.length - 1; i >= 0; i-- ) {
        if ( (+arr[i] + +brr[i]) < 60 ) arr[i] = +arr[i] + +brr[i];
        else {
            arr[i] = +arr[i] + +brr[i] - 60;
            ++arr[i - 1];
        }
        if ( +arr[i] <= 9 ) arr[i] = "0" + +arr[i];
    }
    return arr[0] + ":" + arr[1];
}

function timePlus1( a, num ) {
    var arr = a.split( ':' );
    arr[1] = +arr[1] + +num;
    if ( +arr[1] > 59 ) {
        arr[1] = +arr[1] - 60;
        arr[0] = +arr[0] + 1;
    }
    if ( +arr[1] <= 9 ) arr[1] = "0" + +arr[1];
    if ( +arr[0] <= 9 ) arr[0] = "0" + +arr[0];
    return arr[0] + ":" + arr[1];
}
function timeMinus1( a, num ) {
    var arr = a.split( ':' );
    arr[1] = +arr[1] - +num;
    if ( +arr[1] < 0 ) {
        arr[1] = +arr[1] + 60;
        arr[0] = +arr[0] - 1;
    }
    if ( +arr[1] <= 9 ) arr[1] = "0" + +arr[1];
    if ( +arr[0] <= 9 ) arr[0] = "0" + +arr[0];
    return arr[0] + ":" + arr[1];
}
/*function time_second2 (a){
 var  time= new Date(0);
 time.setSeconds(a);
 var time2= time.toUTCString();//toTimeString();
 time2=time2.slice(17,25); //если время не в формате 00:00:00
 var arr = time2.split(":");
 return arr[0] + ":"+ arr[1]+ ":"+ arr[2];
 }
 */

// возвращает время за 1 день, неделю, месяц до текущего
function setPeriod( digit ) {
    var time3 = new Date();
    switch ( digit ) {

        case "0":
            time3.setDate( time3.getDate() - 1 );
            break;
        case "1":
            time3.setDate( time3.getDate() - 7 );
            break;
        case "2":
            time3.setMonth( time3.getMonth() - 1 );
            break;
        case "3":
            time3.setFullYear( time3.getFullYear() - 1 );
            break;
    }

    return time3.toISOString();
}
function getTimeNow1( digit ) {
    var d = new Date();

    console.log( d );
    //  var day = d.getDate();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds(); //timeorder время в секундах с начала

    // if (day <= 9) day = "0" + day;
    if ( hours <= 9 ) hours = "0" + hours;
    if ( minutes <= 9 ) minutes = "0" + minutes;
    if ( seconds <= 9 ) seconds = "0" + seconds;
    if ( digit == 0 ) return hours + ":" + minutes + ":" + seconds;
    if ( digit == 1 ) return hours + ":" + minutes;
}

function sliceTime( a, digit ) {

    if ( digit == 1 ) {
        if ( a[2] == ':' ) return a.slice( 0, 5 ); //toTimeString();
        if ( a.length > 20 ) return a.slice( 17, 22 );//toUTCString()
        return a.slice( 11, 16 ); //golang
    }
    if ( a.length > 20 ) return a.slice( 17, 25 );
    return a.slice( 11, 19 );
}

function getTimeOnTime() {

    var date = $( "#select_date" ).val(),
        time = $( "#select_time" ).val();
    //2016-11-10T14:58:04.095037Z
    return date + "T" + time + ":00Z";
}

function getTimeOnNow() {

    var _date = new Date();
    var _hours = parseInt( _date.getHours() );
    var _minutes = parseInt( _date.getMinutes() );
    var _secondes = parseInt( _date.getSeconds() );
    var _time = (_hours < 10 ? '0' + _hours : _hours) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
    var _months = parseInt( _date.getMonth() ) + 1;
    _months = _months < 10 ? '0' + _months : _months;
    var _day = parseInt( _date.getDate() );
    _day = _day < 10 ? '0' + _day : _day;
    _date = _date.getFullYear() + '-' + _months + '-' + _day;
    //2016-11-10T14:58:04.095037Z
    return _date + "T" + _time + ":" + (_secondes < 10 ? '0' + _secondes : _secondes) + "Z";
}

function getTimeToday() {

    var _date = new Date();
    var _hours = parseInt( _date.getHours() );
    var _minutes = parseInt( _date.getMinutes() );
    var _time = (_hours < 10 ? '0' + _hours : _hours) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
    var _months = parseInt( _date.getMonth() ) + 1;
    _months = _months < 10 ? '0' + _months : _months;
    var _day = parseInt( _date.getDate() );
    _day = _day < 10 ? '0' + _day : _day;
    _date = _date.getFullYear() + '-' + _months + '-' + _day;
    //2016-11-10T14:58:04.095037Z
    return _date + "T00:00:00Z";
}
function getTimeHM( time ) {
    //2016-11-10T14:58:04.095037Z
    if ( !time ) return "00:00";
    return time.slice( 11, 16 );
}
function getTimeHMminus( time ) {

    var _date = new Date();
    var _hours = parseInt( _date.getHours() );
    var _minutes = parseInt( _date.getMinutes() );
    if ( !time ) return (_hours < 10 ? '0' + _hours : _hours) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
    // _date =_date.toUTCString();
    if ( time[2] == ':' ) time = time.slice( 0, 5 );
    //if time19=='.'
    if ( time.length > 28 ) time = time.slice( 17, 22 );//toUTCString()
    if ( time[19] == '.' ) time = time.slice( 11, 16 );
    var arr = time.split( ':' );

    if ( arr[1] > _minutes ) {
        _minutes = _minutes - arr[1] + 60;
        _hours = _hours - 1;
    }
    else _minutes = _minutes - arr[1];
    if ( arr[0] > _hours ) {
        _hours = _hours - arr[0] + 24;
    }
    else _hours = _hours - arr[0];

    var _time = (_hours < 10 ? '0' + _hours : _hours) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
    return _time;
}
function getTimeHM( time ) {
    //2016-11-10T14:58:04.095037Z
    if ( !time ) return "00:00";
    return time.slice( 11, 16 );
}