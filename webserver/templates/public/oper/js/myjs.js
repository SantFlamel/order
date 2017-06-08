function procCollapse() {
    document.navbar.style.maxHeight = "auto";
}

// Дата и время

function getTime() {
    var d = new Date();
    var month_num = d.getMonth();
    var day_num = d.getDay();
    var day = d.getDate();
    var hours = d.getHours();
    var minutes = d.getMinutes();

    month = new Array( "января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря" );
    weekday = new Array( "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" );

    if ( day <= 9 ) day = "0" + day;
    if ( hours <= 9 ) hours = "0" + hours;
    if ( minutes <= 9 ) minutes = "0" + minutes;

    current_time = hours + ":" + minutes;
    current_date = weekday[day_num] + ",  " + day + " " + month[month_num];
    if ( document.layers ) {
        document.layers.doc_time.document.write( current_time );
        document.layers.doc_date.document.write( current_date );
        document.layers.doc_time.document.close();
        document.layers.doc_date.document.close();
    } else {
        document.getElementById( "doc_time" ).innerHTML = current_time;
        document.getElementById( "doc_date" ).innerHTML = current_date;
        document.getElementById( "doc_time_dark" ).innerHTML = current_time;
        document.getElementById( "doc_date_dark" ).innerHTML = current_date;
    }
    setTimeout( "getTime()", 30000 );
}

getTime();

// Таймер на увеличение 

var clickNumber = 0;

function startTimer() {
    var timers = $( "[data-role=timer]" );
    $.each( timers, function ( key, up_timer ) {
        timer( up_timer );
    } );
}


// Доставка ко времени
$( '#select_date, #select_time' ).prop( 'disabled', false );
$( '#select_date' ).attr( 'style', 'display:none;' );
$( '#select_time' ).attr( 'style', 'display:none;' );
$( '#on_time' ).prop( "checked", false );

$( '#on_time' ).on( 'click', function () {
    $( this ).toggleClass( 'checked' );
    if ( $( '#on_time' ).hasClass( 'checked' ) ) {
        console.log( 'dct jr' );
        $( '#select_date' ).attr( 'style', 'display:inline-block;' );
        $( '#select_time' ).attr( 'style', 'display:inline-block;' );
        var x = true,
            _date = new Date(),
            _hours = parseInt( _date.getHours() ),
            _minutes = parseInt( _date.getMinutes() ),
            _time = ((_hours + 2) % 24 < 10 ? '0' + (_hours + 2) % 24 : (_hours + 2) % 24) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
        //var _time = (_hours < 10 ? '0' + _hours : _hours) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
        var _months = parseInt( _date.getMonth() ) + 1;
        _months = _months < 10 ? '0' + _months : _months;
        var _day = parseInt( _date.getDate() );
        _day = _day < 10 ? '0' + _day : _day;
        _date = _date.getFullYear() + '-' + _months + '-' + _day;
        $( '#select_time' ).val( _time );
        $( '#select_date' ).attr( 'min', _date ).val( _date );
        /* return function () {
         x = !x;
         $('#select_date, #select_time').prop('disabled', x);
         }*/

    }
    else {
        $( '#select_date' ).attr( 'style', 'display:none;' );
        $( '#select_time' ).attr( 'style', 'display:none;' );
    }

    if ( $( "#on_time" ).is( ":checked" ) ) {//?$("#select_time").val():getTimeOnNow();
        $( "#timeFinish1" ).html( timeMinus1( $( "#select_time" ).val(), 30 ) );
        $( "#timeFinish2" ).html( timeMinus1( $( "#select_time" ).val(), 1 ) );
    } else {
        $( "#timeFinish1" ).html( timePlus1( getTimeHM( getTimeOnNow() ), 30 ) );
        $( "#timeFinish2" ).html( timePlus1( getTimeHM( getTimeOnNow() ), 59 ) );
    }
} );


// Строка поиска в операторке

$( '.operator_panel .fa.fa-search' ).on( 'click', function () {
    $( '.operator_panel .tab-pane thead tr:last-child' ).toggleClass( 'visible-tr' );

} );

// Переключатель онлайн-оффлайн

function onOff() {
    if ( $( 'i:hover' ).hasClass( 'fa-toggle-on' ) ) {
        $( 'i:hover' ).removeClass( 'fa-toggle-on' ).addClass( 'fa-toggle-off' );
    } else if ( $( 'i:hover' ).hasClass( 'fa-toggle-off' ) ) {
        $( 'i:hover' ).removeClass( 'fa-toggle-off' ).addClass( 'fa-toggle-on' );
    }
}

// Набор номера

function number_tel( num ) { // работает криво
    var _input = $( '#tel_num' );
    var _input_val = _input.val();
    _input_val = _input_val ? _input_val : "8(___)___-__-__";
    for ( var i in _input_val ) {
        if ( _input_val[i] == '_' ) {
            _input_val = _input_val.replace( '_', num );
            _input.val( _input_val );
            break;
        }
    }
}

// Переключение между активным звонком и набором номера

$( '.call-button' ).on( 'click', function () {
    $( this ).removeClass( 'active' );
    $( '.sidebar' ).attr( 'style', 'background: #303031;' );
} );
$( '.finishcall-button' ).on( 'click', function () {
    $( this ).removeClass( 'active' );
    $( '.sidebar' ).attr( 'style', 'background: transparent;' );
} );

// Набор номера
jQuery( function ( $ ) { // маска номера телефона
    $.mask.definitions['~'] = '[+-]';
    $( '.tel_num' ).mask( '7(999)999-99-99', {
        completed: function () {
        }
    } );
} );
//
function number_tel( num ) {
    var _input = $( '#tel_num' );
    var _input_val = _input.val();
    _input_val = _input_val ? _input_val : "7(___)___-__-__";
    if ( _input_val.indexOf( '_' ) ) {
        _input_val = _input_val.replace( '_', num );
        _input.val( _input_val );
    }
}

function getNumber( id ) {
    id = id || 'tel_num';
    var t = document.getElementById( id ).value;
    return t.replace( /[()-]/g, '' )
};

$( "#product_search" ).on( "click", function () {
    $( "#product_search" ).val( "" );
    $( "#product_search" ).keyup();
    //$('.filters input').keyup();
} );

