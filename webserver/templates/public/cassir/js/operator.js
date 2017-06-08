// !!! указывать город
// !!! при создании заказа спрашиваем "предзаказ" или нет. если предзаказ то то вызываем операторский интерфейс, иначе корзину.
// : V подсчёт сдачи
////////--------| Customer |----------------------------------------------------------
// TODO: V очистка полей.
// function Customer( c ) {
//     //     var s = { "Order_id": 170, "NameCustomer": "Алексей",
//     //     "Phone": "8(919)581-38-88", "Note": "", "City": "Курган",
//     //     "Street": "Гоголя", "House": 38, "Building": "0",
//     //     "Floor": 0, "Apartment": 0, "Entrance": 0, "DoorphoneCode": "0" };
//     var i, ii;
//     for ( i in Customer.list ) {
//         ii = Customer.list[i];
//         if ( ii.Phone == c.Phone && ii.City == c.City && ii.Street == c.Street && ii.House == c.House &&
//             ii.Building == c.Building && ii.Floor == c.Floor && ii.Apartment == c.Apartment &&
//             ii.Entrance == c.Entrance && ii.DoorphoneCode == c.DoorphoneCode )
//             return;
//     }
//     for ( i in c ) {
//         this[i] = c[i];
//     }
//     Customer.list.push( this );
//     Customer.makeElement( this );
// }
// Customer.list = [];
// Customer.makeElement = function () {
//     for ( var i in Customer.list ) {
//         Customer.list[i].makeElement()
//     }
// };
function makeAddress( s, i, id ) {
    s = s || {};
    var x = '';
    if ( id ) {
        x = ' data-id_address="' + id + '" '
    }
    return '<div ' + x + ' class="panel"> <div class="panel-heading" role="tab" id="heading' + 1 + i + '">' +
        '  <a class="collapsed" role="button" data-toggle="collapse" data-parent="#accordion1"' +
        ' href="#collapse' + 1 + i + '" aria-expanded="false" aria-controls="collapse' + 1 + i + '">' + ' ' +
        (s.Street || '') + ' д. ' + (s.House || '') + ' ' +
        ((s.Building > 0) ? (s.Building || '') : "") + ', кв. ' + ( s.Apartment || '') +
        ' ' + '</a> </div>' + '<div id="collapse' + 1 + i +
        '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading' + 1 + i + '">' +
        '<div class="panel-body">' +
        '<input autocomplete="off" id="street_client" class="col-sm-12 typeahead" type="text" placeholder="Введите адрес" value="' +
        (s.Street || '') + '">' + '<div class="row">' +
        '<label class="col-sm-4" for="home_number">Дом <input autocomplete="off" id="home_number" type="text" value="' +
        (s.House || '') + '"></label>' +
        '<label class="col-sm-4" for="corp_str">Корп./Стр. <input autocomplete="off" id="corp_str" type="text" value="' +
        (s.Building || '') + '"></label>' +
        '<label class="col-sm-4" for="podyezd">Подъезд <input autocomplete="off" id="podyezd" value="' +
        (s.Entrance || '') + '" type="text"></label>' + '</div>' + '<div class="row">' +
        '<label class="col-sm-4" for="level">Этаж <input autocomplete="off" id="level" type="text" value="' +
        (s.Floor || '') + '"></label>' +
        '<label class="col-sm-4" for="kv_of">Кв./Оф. <input autocomplete="off" id="kv_of" type="text" value="' +
        (s.Apartment || '') + '"></label>' +
        '<label class="col-sm-4" for="cod">Код <input autocomplete="off" id="cod" value="' +
        (s.DoorphoneCode || '') + '" type="text"></label>' + '</div> <div class="pull-right">' +
        '<input autocomplete="off" type="checkbox" id="domofon"><label style="font-size: 14px" for="domofon">Домофон</label>' +
        '</div> </div> </div> </div>';
}
// Customer.makeElement = function () {
//     var newaddress, i;
//     for ( i in Customer.list ) {
//         newaddress = makeAddress( Customer.list[i], i + 1 );
//         $( "#accordion1" ).append( newaddress );
//     }
//     $( document ).ready( function () {
//         //проверка адреса доставки при изменении
//         // $( ".operator_client_adress .collapse #street_client, .operator_client_adress .collapse #home_number" )
//         //     .change( function () {
//         //         if ( $( '.delivery_met.active a' ).first().html() === DELIVERY ) {
//         //             MSG.requestDeliveryZone( $( "#city_client" ).val(), $( this ).next().find( "#street_client" ).val(),
//         //                 $( this ).next().find( "#home_number" ).val() );
//         //         }
//         //     } );
//         // $( ".operator_client_adress" ).find( ".panel-heading" ).on( "click", function () {
//         //     if ( $( '.delivery_met.active a' ).first().html() === DELIVERY ) console.log( this );
//         //     MSG.requestDeliveryZone( $( "#city_client" ).val(), $( this ).next().find( "#street_client" ).val(),
//         //         $( this ).next().find( "#home_number" ).val() );
//         // } );
//         //автоподстановка адреса улица из справочника
//         $( '.operator_client_adress .collapse #street_client' ).typeahead( {
//             hint: false, highlight: true, minLength: 1
//         }, {
//             name: 'Street', source: substringMatcher( typeaheadStreet )
//         } );
//     } );
// };
//--------------\ Customer |----------------------------------------------------------

$( '#loadtel' ).on( 'click', function () {
    $( "#accordion1" ).empty().append( makeAddress( {}, 0 ) );
    MSG.request.clientInfo();
    bindTypeaheadAddress();
} );

// Доставка ко времени
$( document ).on( 'click', '#on_time', function () {
    var s = $( '#select_date, #select_time' );
    s.prop( 'disabled', (!s.prop( 'disabled' )) );
    if ( !s.prop( 'disabled' ) ) {
        document.getElementById( 'select_date' ).value = Page.time( false, true ).split( ' ' )[0]
    }
} );
$( document ).on( 'click', '#to_workers', function () {
    var s = $( '#input_to_workers' );
    s.css( 'display', ( $( this ).prop( 'checked' ) ? '' : 'none') );
    Cart.showPrice()
} );

$( '#select_date, #select_time' ).prop( 'disabled', true );
$( '#on_time' ).prop( "checked", false );


////////--------| select_adres |----------------------------------------------------------
// $('.panel [role="button"]').on('click', function (  ) {
//     console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
//     $('.panel [role="button"]').addClass('collapsed').attr('aria-expanded', 'false');
//     $('.panel-collapse.collapse.in').removeClass('in').attr('aria-expanded', 'false');
// });
//--------------\ select_adres |----------------------------------------------------------

//---------------------------навигация между вкладками

// заказ клиента на след страницу
$( '#next_btn' ).click( function () {
    $( '#tab_client' ).removeClass( "active" );
    $( '#client' ).removeClass( "active" );
    $( '#tab_order' ).addClass( "active" );
    $( '#order_client' ).addClass( "active" )
} );


$( ".clearbutton" ).on( 'click', function () {
    $( this ).prev().val( "" );
} );

$( "#client_name" ).keyup( function () {
    var $input = $( this ), phone_client_name = $input.val();
    $( ".client_name_oper" ).html( phone_client_name );
} );


//---------- приготовить сдачу
$( ".money_summ a" ).click( function () {
    $( "#ostatok" ).val( this.text );

} );
$( '#ostatok' ).next().click( function () {
    $( "#ostatok" ).val( "" );
} );
//-----
// $( document ).on( 'change', '#take_away_address', function () {
//     MSG.request.AvailableProd( this.value )
// } );

$( document ).on( 'click', '#finish_btn', function () {
    try {
        MSG.sendOrder();
        Cart.cancelOrder();
        // Page.show.Cassir();
    } catch ( e ) {
        console.error( e );
        alert( 'Возникли проблемы с отправкой заказа!!!' )
    }
    // : V возврат в карзину после отправки заказа
} );

$( document ).on( 'change', ".operator_client_adress  .collapse.in input", function () {
    this.parentNode.parentNode.parentNode.parentNode.parentNode.dataset.id_address = '';
} );

// $( ".operator_client_adress .collapse #street_client, .operator_client_adress .collapse #home_number" )
//     .change( function () {
//         if ( $( '.delivery_met.active a' ).first().html() === DELIVERY ) {
//             MSG.requestDeliveryZone();
//         }
//     } );
// $( ".operator_client_adress .panel-heading" ).on( "click", function () {
//     if ( $( '.delivery_met.active a :first' ).html() === DELIVERY ) {
//         MSG.requestDeliveryZone();
//     }
// } );

////////--------| Autocomplite |----------------------------------------------------------
var substringMatcher = function ( strs ) {
    return function findMatches( q, cb ) {
        var matches, substringRegex;
        matches = [];
        substringRegex = new RegExp( q, 'i' );
        $.each( strs, function ( i, str ) {
            if ( substringRegex.test( str ) ) {
                matches.push( str );
            }
        } );

        cb( matches );
    };
};
function bindTypeaheadAddress() {
    $( '.operator_client_adress .collapse #street_client' ).typeahead( {
        hint: false, highlight: true, minLength: 1
    }, {
        name: 'Street', source: substringMatcher( typeaheadStreet )
    } );
}


var typeaheadStreet = ['1 Мая', '2351', '8 Марта', '8 Райсъезда', '9 Мая', '9 Января', 'Авиационная',
    'Автозаводская 1-я', 'Автозаводская 2-я', 'Автозаводская', 'Агрономическая', 'Акмолинская', 'Алексеева', 'Алябьева',
    'Анфиногенова', 'Арбинская', 'Аргентовского', 'Артема', 'Аэропорт', 'Бажова', 'Баумана', 'Башняговского', 'Бедного',
    'Белинского', 'Березовая', 'Березовая', 'Библиотечный переулок', 'Блюхера', 'Больничная 4-я', 'Больничная 5-я',
    'Больничная 6-я', 'Больничная 7-я', 'Больничная 9-я', 'Больничная 10-я', 'Боровлянский переулок', 'Бородина',
    'Бошняковская', 'Братская', 'Булавина', 'Бурова-Петрова', 'Вагонная', 'Варгашинский переулок', 'Васильева',
    'Ватутина', 'Введенский переулок', 'Витебского', 'Вишневая', 'Войкова', 'Володарского', 'Встречный переулок',
    'Выгонная', 'Высоковольтный переулок', 'Гагарина', 'Гайдара', 'Галкинская', 'Галкинский переезд', 'Гаражная',
    'Гастелло', 'Гвардейская', 'Гвардейский переулок', 'Герцена', 'Глинки', 'Глинская', 'Гоголя', 'Голикова проспект',
    'Гончарова', 'Городской сад парк', 'Горького', 'Горяева', 'Грибоедова', 'Гризодубовой', 'Грицевца', 'Громовой',
    'Губанова', 'Дальний переулок', 'Дамбовая', 'Дачный переулок', 'Декабристов', 'Джамбула', 'Дзержинского переулок',
    'Дзержинского', 'Димитрова', 'Добролюбова', 'Доватора', 'Докучаева', 'Дома Кургансельмаша', 'Дома Мелькомбината',
    'Дома МСУ', 'Донского', 'Достоевского', 'Дружбы', 'Дундича', 'Епишева', 'Ермака', 'Жданова',
    'Железнодорожный переулок', 'Жуковского', 'Заводская 1-я', 'Загорная', 'Загородный переулок', 'Зайковский переулок',
    'Зайцева', 'Западный переулок', 'Заречная', 'Заслонова', 'Затобольный переулок', 'Зауральская', 'Зеленая',
    'Зеленый переулок', 'Земнухова', 'Зорге', 'Иковский переулок', 'Илизарова', 'Интернатовская', 'Интернациональная',
    'Ипподромная', 'Иртышская', 'Исетская', 'Калашниковское торфопредприятие', 'Калинина', 'Карбышева', 'Карельцева',
    'Катайский переулок', 'Керамическая', 'Кетовский переулок', 'Кирова', 'Кирпичная', 'Климова', 'Колхозная',
    'Кольцевая', 'Комиссаров', 'Коммунальная', 'Комсомольская', 'Конституции проспект', 'Кооперативная', 'Короленко',
    'Косая', 'Космодемьянской', 'Космонавтов', 'Кособродский переулок', 'Котовского', 'Кошевого', 'Кравченко',
    'Красина', 'Краснодонская', 'Красномаячная', 'Красномаячный переулок', 'Кремлева', 'Криволапова', 'Крупской',
    'Крутикова', 'Крылова', 'Кузнецова', 'Куйбышева переулок', 'Куйбышева', 'Кулибина', 'Культурный переулок',
    'Куприна', 'Курганская', 'Куртамышская', 'Кустанайская', 'Ладыгина', 'Лазо', 'Ленина', 'Ленинградская',
    'Лермонтова', 'Лескова', 'Лесопарковая', 'Линейная', 'Локомотивная', 'Ломоносова', 'Луговая', 'Луначарского',
    'Майкова', 'Макаренко', 'Малая Южная', 'Малиновский переулок', 'Малиновского', 'Малочаусовский переулок',
    'Мальцева', 'Мамина-Сибиряка', 'Маркса', 'Матросова', 'Машиностроителей переулок', 'Машиностроителей проспект',
    'Маяковского', 'Маячная 1-я', 'Маячная 2-я', 'Маячная', 'Межевая 1-я', 'Межевая 2-я', 'Мелькомбинат', 'Менделеева',
    'Мечникова', 'Мира бульвар', 'Мичурина', 'Молодежи парк', 'Молодежи переулок', 'Молодежи', 'Молодой Гвардии',
    'Монтажников', 'Московская', 'Мост Тобол', 'Мостовая', 'Мостопоезд', 'Мостостроителей', 'Мусоргского', 'Мяготина',
    'Набережная', 'Нагорная', 'Нагорный переулок', 'Нахимова', 'Невежина', 'Невского', 'Некрасова', 'Нефтебаза',
    'Новаторов', 'Новая', 'Новогалкинская', 'Новоселов', 'Новостроек', 'Овражная', 'Огарева', 'Огинского', 'Огородная',
    'Огородный переулок', 'Односторонка 1-я', 'Односторонка 2-я', 'Односторонка', 'Одоевского', 'Озерная',
    'Октябрьская', 'Олимпийская', 'Омская', 'Омский переулок', 'Орджоникидзе', 'Орлова', 'Осипенко', 'Островского',
    'Отдыха', 'Откормсовхоз', 'Павлова', 'Панфилова', 'Парижской Коммуны', 'Партизанская', 'Пархоменко',
    'Первомайский переулок', 'Перова', 'Пестеля', 'Песчаная', 'Песчаный переулок', 'Петропавловская', 'Пионерская',
    'Пирогова', 'Пичугина', 'Плеханова', 'Плодопитомник', 'Победы', 'Пограничная', 'Полевая площадь Полевая',
    'Ползунова', 'Половинская', 'Полярная', 'Попова переулок', 'Попова', 'Почтовая', 'Правды', 'Прибрежная',
    'Пригородная', 'Пролетарская', 'Промышленная', 'Просветский переулок', 'Профсоюзная', 'Проходная', 'Птицефабрика',
    'Пугачева', 'Пурица', 'Пушкина', 'Рабоче-Крестьянская', 'Рабочий переулок', 'Радиомаяк', 'Радионова', 'Радищева',
    'Радужный переулок', 'Разина', 'Репина', 'Репниных', 'Родниковая', 'Родькина', 'Рубинштейна', 'Рылеева',
    'Рябиновая', 'Рябковская', 'Савельева', 'Савельевский переезд', 'Садовая', 'Садовый переулок', 'Сады Зауралья',
    'Саратовский переулок', 'Свердлова', 'Свободы', 'Сельская', 'Серова', 'Сеченова', 'Сибирская', 'Слосмана площадь',
    'Смирнова', 'СМП-290', 'Советская', 'Совхозный переулок', 'Солнечная', 'Солнечный бульвар', 'Союзная',
    'Спартака переулок', 'Спартака', 'Спортивная', 'Спортивный переулок', 'Стальского', 'Станционная',
    'Строительный переулок', 'Стройбаза', 'Суворова', 'Сурикова', 'Сусанина', 'Сухэ-Батора', 'Тельмана', 'Тепловозная',
    'Техническая', 'Тимирязева', 'Тобольная', 'Товарная', 'Томина', 'Томская', 'Торфопредприятие', 'Трактовая 1-я',
    'Трактовая 2-я', 'Тропинина', 'Тургенева переулок', 'Тюленина', 'Тюменская', 'Тютчева', 'Увальская', 'Ульяновой',
    'Уральская', 'Урицкого', 'Урожайная', 'Уфимская', 'Ушакова', 'Февральская', 'Фестивальная', 'Филатова', 'Фрунзе',
    'Фурманова', 'Хабаровская', 'Халтурина', 'Химмашевская', 'Хмельницкого', 'Цвиллинга', 'Целинная', 'Центральная',
    'Центральная', 'Центральная', 'Цеткин', 'Циолковского', 'ЦПКиО парк', 'Чайковского', 'Чапаева', 'Часовая 2-я',
    'Часовая', 'Чаусовская', 'Чашинский переулок', 'Челюскинцев', 'Челябинская', 'Черемуховская', 'Чернореченская',
    'Чернышевского', 'Черняховского', 'Чехова', 'Чистое поле', 'Чистопрудный переулок', 'Чистый переулок', 'Чкалова',
    'Шатровский переулок', 'Шевелевская', 'Шевцовой', 'Шевченко переулок', 'Шевченко', 'Широкий переулок', 'Школьная',
    'Шумана', 'Щорса', 'Элеваторный переулок', 'Электровозная', 'Энгельса переулок', 'Энергетическая', 'Юбилейная',
    'Югова', 'Южная', 'Юлаева', 'Юннатов', 'Юргамышская', 'Яблочкина', 'Ялуторовская', 'Ястржембского'];
bindTypeaheadAddress();

//--------------\ Autocomplite |----------------------------------------------------------