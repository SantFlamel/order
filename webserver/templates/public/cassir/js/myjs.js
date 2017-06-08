// TODO: поправка времени.
checkUndefined = function () {
    var i, ii, j, jj, len = arguments.length;
    for ( i = 0; i < len; i++ ) {
        ii = arguments[i];
        if ( typeof ii === "object" ) {
            for ( j in ii ) if ( ii.hasOwnProperty( j ) ) {
                jj = ii[j];
                if ( typeof jj == "object" ) {
                    (arguments.callee)( jj ); // рекурсия
                } else {
                    console.assert( (jj != undefined && jj != "undefined"), 'KEY', j, jj, ii );
                }
            }
        } else {
            console.assert( (ii != undefined && ii != "undefined"), 'INDEX', i, ii );
        }
    }
};
cookie = {
    set: function ( name, value, options ) {
        var expires;

        options = options || {};
        expires = options.expires;

        if ( typeof expires == "number" && expires ) {
            var d = new Date();
            d.setTime( d.getTime() + expires * 1000 );
            expires = options.expires = d;
        }
        if ( expires && expires.toUTCString ) {
            options.expires = expires.toUTCString();
        }
        if ( typeof value === "object" ) {
            value = JSON.stringify( value );
        }
        value = encodeURIComponent( value );
        var updatedCookie = name + "=" + value;

        for ( var propName in options ) {
            updatedCookie += "; " + propName;
            var propValue = options[propName];
            if ( propValue !== true ) {
                updatedCookie += "=" + propValue;
            }
        }

        document.cookie = updatedCookie;
    }, get: function ( name, json ) {
        var matches = document.cookie.match(
            new RegExp( "(?:^|; )" + name.replace( /([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1' ) + "=([^;]*)" ) );
        matches = matches ? decodeURIComponent( matches[1] ) : undefined;
        if ( json && matches != undefined ) {
            matches = JSON.parse( matches );
        }
        return matches;
    }, delete: function ( name, option ) {
        option = option || {};
        option.expires = -1;
        cookie.set( name, "", option )
    }
};
////////--------| WARNINGS_MESSAGE |----------------------------------------------------------
function warning( txt, alert, time, except, impot ) {
    // txt - выводимый текст, alert - тип(null, 'info', 'alert' - разные по цветам)
    // , time - время на которое показывается
    // , except - id сообщения которое нужно удалить при появлении создаваемого
    // возвращает id сообщения.
    // impot - зафиксировать сообщение
    var i, cl = '', id = Math.floor( Math.random() * 1000000 ), id_elem = 'id="' + id + '"'
        , dublicate = $( 'button:contains(' + txt + ')' )
        , disabled = '';
    if ( alert ) {
        cl = 'class="' + alert + '"';
    }
    if ( except ) {
        if ( !Array.isArray( except ) ) {
            warning.del( except );
        } else {
            for ( i in except ) {
                warning.del( except[i] );
            }
        }
    }
    if ( time ) {
        setTimeout( function () {
            warning.del( id );
        }, time );
    }
    if ( impot ) {
        setTimeout( function () {
            $( '#' + id ).removeAttr( 'disabled' )
        }, FREEZE_IMPORTANT_ALERT );
        disabled = 'disabled'
    }
    dublicate.remove();
    document.getElementById( 'warning' ).innerHTML += '<div><button ' + id_elem + ' ' + cl + ' ' + disabled + ' >' + txt + '</button></div>';
    return id;
}
var war = {};
warning.del = function ( id ) {
    $( '#' + id ).remove();
};
$( document ).on( 'click', '#warning button', function () {
    $( this ).remove();
} );
//--------------\ WARNINGS_MESSAGE |----------------------------------------------------------


////////--------| AUDIO_ALERT |----------------------------------------------------------
function warningAudio( alert ) {
    alert = alert || 's';
    if ( !warningAudio.timeOut[alert] ) {
        warningAudio.timeOut[alert] = setTimeout( function () {
            warningAudio.timeOut[alert] = false;
            new Audio( "../../public/cassir/audio/ring.mp3" ).play();
        }, 300 );
    }
}
warningAudio.timeOut = { s: false };
//--------------\ AUDIO_ALERT |----------------------------------------------------------


// 'asdfkja;lskj213421lk3j4;k}}}}}}}{{{l/\j;lkj;21"""""""""""""""\'\'\'\'\'\'\'\{}[][][][][][][][][][][][]kj3,,,,4lkj;l...kj;'.replace( /[}{'"]/g, '' )


////////--------| time |----------------------------------------------------------
// Дата и время
var getTime = function () {
    var d = new Date(), month_num = d.getMonth()
        , day_num = d.getDay(), day = d.getDate()
        , hours = d.getHours(), minutes = d.getMinutes()
        , month = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]
        , weekday = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

    if ( day <= 9 ) {
        day = "0" + day;
    }
    if ( hours <= 9 ) {
        hours = "0" + hours;
    }
    if ( minutes <= 9 ) {
        minutes = "0" + minutes;
    }

    var current_time = hours + ":" + minutes, current_date = weekday[day_num] + ",  " + day + " " + month[month_num];

    $( 'span.doc_time' ).html( current_time ); //TEST
    $( 'span.doc_date' ).html( current_date ); //TEST

    setTimeout( getTime, 30000 );
};
getTime();

Page = {};

Page.time = function ( _time, simple ) {
    // "2016-11-10T14:58:04.09503701Z"
    var now, time;
    if ( _time ) {
        now = _time
    } else {
        now = new Date()
    }
    var year = now.getFullYear(), month = now.getMonth() +
        1, day = now.getDate(), hours = now.getHours(), minutes = now.getMinutes();

    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    if ( !simple ) {
        var seconds = now.getSeconds(), milliseconds = now.getMilliseconds();

        seconds = seconds < 10 ? '0' + seconds : seconds;
        time = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds + 'Z';
        return time;
    } else {
        time = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
        return time;
    }
};
Page.timeToArray = function ( time ) {
    return time.split( /[TZ\-\:]/g ).slice( 0, -1 );
};
Page.timeBeginDay = function ( date ) {
    date = date || new Date();
    return Page.time( new Date( new Date( date.setDate( date.getDate() ) ).setHours( 0, 0, 0, 0 ) ) );
};
Page.timeReplace = function ( time ) {
    return time.replace( /[T]|[.].+|[Z]/g, ' ' );
};


function waitProp( fn, cond, time, limit, fin ) {
    // fn - функция которая будет исполнена если функция cond вернёт ~true
    var i = 0, t = time || 100, lim = limit || 50;
    (function () {
        if ( cond() ) {
            fn();
        } else if ( i < lim ) {
            console.log( 'no no no' );
            i++;
            setTimeout( arguments.callee, t );
        } else {
            if ( fin ) {
                fin();
            }
        }
    })();
}
function wait( text, func, time ) {
    if ( !wait.list[text] ) {
        wait.list[text] = true;
        setTimeout( function () {
            delete wait.list[text];
            func();
        }, time || 100 )
    }
}
wait.list = {};
function timeOutRe( txt, func, time ) {
    if ( ~timeOutRe.list.indexOf( txt ) ) {
    } else {
        var x = timeOutRe.list.push( txt );
        func();
        setTimeout( function () {
            timeOutRe.list.splice( (x - 1), 1 )
        }, time )
    }
}
timeOutRe.list = [];
length = function ( obj ) {
    var len = 0, i;
    for ( i in obj ) {
        len++;
    }
    return len;
};

function counter( val ) {
    var count = val || -1;
    return function () {
        return ++count;
    };
}

function stackOfWaiting( time ) {
    var functions = []
        , exec = function () {
        while ( functions.length ) {
            (functions.shift())();
        }
        timeOut = false;
    }
        , timeOut;
    return function ( func ) {
        functions.push( func );
        if ( !timeOut ) {
            timeOut = setTimeout( exec, time );
        }
    }
}


function division( val, by ) { // для деления, возвращает целое число.
    return (val - val % by) / by;
}

// var x = [];
// x.push( 1 );
// console.log( '1', x );
// x.push( 2 );
// console.log( '2', x );
// x.push( 3 );
// console.log( '3', x );
// x.push( 4 );
// console.log( '4', x );
// x.push( 5 );
// console.log( '5', x );
//
//
// console.log( x.shift(), x );
// console.log( x.shift(), x );
// console.log( x.shift(), x );
// console.log( x.shift(), x );
// console.log( x.shift(), x );

// var x = 'ws.js:90 x10068{Cashbox ERROR Create, TYPE PARAMETERS "" VALUES: []: sql: statement expects 11 inputs; got 12';
// /sql: statement expects 11 inputs; got 12/.test( x );