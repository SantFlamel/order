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
    }
    setTimeout( "getTime()", 30000 );
}

getTime();


$( document ).ready( function () {
    $( ".table-cashbox" ).on( "click", ".table-cashbox__payment", function () {

        $( this ).toggleClass( "table-cashbox__payment--active" );
        $( ".btn-re-check" ).toggleClass( "btn-disabled" );
        $( ".btn-return-check" ).toggleClass( "btn-disabled" );
        $( ".btn-return-check" ).toggleClass( "btn-red" );
    } );
} );


//$('#tel_num, #client_phone').val('8(657)856-78-56');

// Переключатель онлайн-оффлайн
function onOff() {
    if ( $( 'i:hover' ).hasClass( 'fa-toggle-on' ) ) {
        $( 'i:hover' ).removeClass( 'fa-toggle-on' ).addClass( 'fa-toggle-off' );
    } else if ( $( 'i:hover' ).hasClass( 'fa-toggle-off' ) ) {
        $( 'i:hover' ).removeClass( 'fa-toggle-off' ).addClass( 'fa-toggle-on' );
    }
}


$( function () {
    $( '[data-toggle="tooltip"]' ).tooltip()
} );

// Кнопка для активации боковой панели
$( document ).ready( function () {
    $( ".trigger" ).click( function () {
        $( ".panel" ).toggle( "fast" );
        $( this ).toggleClass( "active" );
        return false;
    } );
} );


// Для боковой панели на планшетных экранах
function screen_check() {
    if ( $( window ).width() <= 1600 ) {
        $( '.sidebar-operator' ).addClass( 'panel' );
        $( '.sidebar-operator' ).css( "display", "none" );
        $( '#mydell' ).removeClass( 'col-lg-3' );
    } else {
        $( '.sidebar-operator' ).removeClass( 'panel' );
        $( '.sidebar-operator' ).css( "display", "block" );
        $( '#mydell' ).addClass( 'col-lg-3' );
    }
    ;
}

screen_check();
$( window ).on( 'resize', function () {
    screen_check();
} );


//-------------------------------------------------------------------------- новый заказ

$( 'body' ).on( 'click', '#on_time', (function () { // anonim
    var x = true;
    var _date = new Date();
    var _hours = parseInt( _date.getHours() );
    var _minutes = parseInt( _date.getMinutes() );

    var _time = ((_hours + 2) % 24 < 10 ? '0' + (_hours + 2) % 24 : (_hours + 2) % 24) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
    var _months = parseInt( _date.getMonth() ) + 1;
    _months = _months < 10 ? '0' + _months : _months;
    var _day = _date.getDate();
    _day = _day < 10 ? '0' + _day : _day;
    _date = _date.getFullYear() + '-' + _months + '-' + _day;
    $( '#select_time' ).val( _time );
    $( '#select_date' ).attr( 'min', _date ).val( _date );
    return function () {
        x = !x;
        $( '#select_date, #select_time' ).prop( 'disabled', x );
    }
})() );


$( document ).ready( function () {       /// изменение имени на странице заказа
    $( "#client_name" ).keyup( function () {
        var $input = $( this ),
            inputContent = $input.val();
        phone_client_name = $input.val();
        $( ".client_name_oper" ).html( phone_client_name );
    } )
} )


//---------- приготовить сдачу
$( ".money_summ a" ).click( function ( event ) {
    $( "#ostatok" ).val( this.text );

} )
$( '#ostatok' ).next().click( function () {
    $( "#ostatok" ).val( "" );
} );

//-----


//-------------------------------------------------------------------------------------------------------------------
// $(document).ready(function(){   /// фильтрация в таблице по нескольким полям
//     $('.btn-filter').click(function(){
//         var $panel = $('.filterable'),
//             $filters = $panel.find('.filters input'),
//             $tbody = $panel.find('.table tbody');
//         if ($filters.prop('disabled') == true) {
//             $filters.prop('disabled', false);
//             $filters.first().focus();
//         } else {
//             $filters.val('').prop('disabled', true);
//             $tbody.find('.no-result').remove();
//             $tbody.find('tr').show();
//         }
//
//         // $.each($panel,function (num,panel1) {
//         // console.log("PANEL_______"+this);
//         // })
//     });
// //TODO onchange загрузка по городу телефону адресу
//
//
//
//     $('.filters').keyup(function(e){
//         // Ignore tab key /
//         var code = e.keyCode || e.which;
//         if (code == '9') return;
//         // Useful DOM data and selectors /
//         var $panel = $('.filterable'),
//             $table = $('.table'),
//             $rows = $(this).parents('.filterable').find('tr.table-operator__row'),
//            // $rows2 = $('tr.table-operator__row'),
//
//             //$input = $(this),
//             //inputContent = $input.val().toLowerCase(),
//             $columns =$(this).parents('.filters').find('input');
//             //console.log($input.val());
//             var inputContent1= $columns.eq(0).val().toLowerCase(),
//             inputContent2= $columns.eq(1).val().toLowerCase(),
//             inputContent3= $columns.eq(2).val().toLowerCase(),
//             inputContent4= $columns.eq(3).val().toLowerCase(),
//             inputContent5= $columns.eq(4).val().toLowerCase(),
//             inputContent6= $columns.eq(5).val().toLowerCase(),
//             inputContent7= $columns.eq(6).val().toLowerCase(),
//             inputContent8= $columns.eq(7).val().toLowerCase(),
//             inputContent9= $columns.eq(8).val().toLowerCase(),
//             inputContent10= $columns.eq(9).val().toLowerCase();
//             column = $(this).parents('.filters th').index($input.parents('th')) ;
//
//
//         var $filteredRows = $rows.filter(function(){
//             var value1 = $(this).find('td').eq(0).text().toLowerCase(),
//                 value2 = $(this).find('td').eq(1).text().toLowerCase(),
//                 value3 = $(this).find('td').eq(2).text().toLowerCase(),
//                 value4 = $(this).find('td').eq(3).text().toLowerCase(),
//                 value5 = $(this).find('td').eq(4).text().toLowerCase(),
//                 value6 = $(this).find('td').eq(5).text().toLowerCase(),
//                 value7 = $(this).find('td').eq(6).text().toLowerCase(),
//                 value8 = $(this).find('td').eq(7).text().toLowerCase(),
//                 value9 = $(this).find('td').eq(8).text().toLowerCase(),
//                 value10 = $(this).find('td').eq(9).text().toLowerCase();
//
//             if ((value1.indexOf(inputContent1) === -1 )||
//                 (value2.indexOf(inputContent2) === -1 )||
//                 (value3.indexOf(inputContent3) === -1 )||
//                 (value4.indexOf(inputContent4) === -1 )||
//                 (value5.indexOf(inputContent5) === -1 )||
//                 (value6.indexOf(inputContent6) === -1 )||
//                 (value7.indexOf(inputContent7) === -1 )||
//                 (value8.indexOf(inputContent8) === -1 )||
//                 (value9.indexOf(inputContent9) === -1 )||
//                 (value10.indexOf(inputContent10) === -1 )) {
//                    // var trid= this.id;
//                    // trid="#t"+trid;
//                   //  $(trid).filter(function(){return true;});
//                     return true};   // $row.filter
//         });
//
//         // Clean previous no-result if exist /
//         $table.find('tbody .no-result').remove();
//
//         //отображает все строки, закрывает все слайды, убирает выделения, скрывает отфтльтрованные
//         $rows.show();
//         $(".table-operator__spoiler-content").slideUp();
//         $rows.removeClass("table-operator__row--active");
//         $filteredRows.hide();
//
//         // Prepend no-result row if all rows are filtered /
//         if ($filteredRows.length === $rows.length) {
//             $table.find('tbody').prepend($('<tr class="no-result text-center"><td colspan="'+ $table.find('.filters th').length +'">No result found</td></tr>'));
//         }
//     });
// });
