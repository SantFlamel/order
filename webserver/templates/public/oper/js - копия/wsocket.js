/**
 * Created by ALEX on 28.02.2017.
 */


var TypePayments = { 1: "Наличными", 2: "Картой" };
var SessionInfo1 = {};
var client_hash = "";

var user_stat = {
    WorkHours: 0,             //Часы с нач.мес.: 148
    TimeGetMedium: "0",       //Среднее время принятие заказа: 1:15
    Rating: 0,                  //Рейтинг: 95
    BalansMinus: 0,          //Списания: 3 552
    Balans: 0               //Баланс: 15 451
};
var
    active_count = $( "#active_tab a span" ).html(),
    preorder_count = $( "#done_tab a span" ).html(),
    done_count = $( "#preorder_tab a span" ).html();


//TODO удалить запись в куки

var hash = $.cookie( 'hash' );
//if (hash)
SessionInfo1.SessionHash = hash;
//else
//   document.location.href =auth_page;

var Organizations = [];

// type OrgProdInfo struct { //продукты организации
//     ID int64
//     OrgHash string
//     ProdHash string
//     Active bool
//     CreationTime time.Time
//
//     Activef bool
// }

var orders = {};   // {oo:[]};
var orders1 = {};
var telinfo = {};
var products = {};


var Status = {
    1: { "ID": 1, "Name": "Предзаказ" },
    2: { "ID": 2, "Name": "Принят" },
    3: { "ID": 3, "Name": "Передан" },
    4: { "ID": 4, "Name": "В работе" },
    5: { "ID": 5, "Name": "Раскатка" },
    6: { "ID": 6, "Name": "Начинение" },
    7: { "ID": 7, "Name": "Запекание" },
    8: { "ID": 8, "Name": "Приготовлен" },
    9: { "ID": 9, "Name": "Собран" }, //8 -9
    10: { "ID": 10, "Name": "Доставлятся" },//6 -9
    11: { "ID": 11, "Name": "Доставлен" },//7 -10
    12: { "ID": 12, "Name": "На месте в ожидании" },//8 -11
    13: { "ID": 13, "Name": "Заказ не забрали" },//9 -12
    14: { "ID": 14, "Name": "На переделке" },//10 -13
    15: { "ID": 15, "Name": "Отменен со списанием" },//11 -14
    16: { "ID": 16, "Name": "Отменен без списания" }//12 -15
};//2 3 4 5 6 7 8 9 10 12 13 14 - активные
//11 15 16 - завершенные

var ws;
var WSerror, WSdata, WSidMsg;

newWS();
//setTimeout(getProduct(),10000);//загружаем продукты

function newWS() {
    console.log( 'not open' );
    ws = new WebSocket( addressWS );
    //warning("Подключение",'i', 5000);
    ws.onopen = function () {
        console.log( 'open' );
        warning( "Подключено", 'i', 5000 );
        console.log( '{"HashAuth":"' + SessionInfo1.SessionHash + '"}' );
        ws.send( '{"HashAuth":"' + SessionInfo1.SessionHash + '"}' );

        if ( ws.readyState == 1 ) getSessionHash();
        setTimeout( 'if (ws.readyState==1) getOrg("Курган")', 1000 );  //загружаем адреса доставки
        setTimeout( 'if (ws.readyState == 1) getorderdiapazon(getTimeToday(), getTimeOnNow(), 1000, 0)', 3000 );//загружаем заказы
        console.log( ws.readyState );
    };
    ws.onerror = function ( e ) {
        warning( "Ошибка подключения", 'a', 5000 );
        return function () {
            console.log( 'error:', e );
        }
    };
    ws.onclose = function () {
        console.log( 'close' );
        warning( "Подключение закрыто", 'a', 5000 );
        setTimeout( newWS, 5000 );
        // нужен таймаут перед подключением.
        // ws = new WebSocket('ws://localhost:8080/ws');
    };
    // function Xx( msg ) {
    //     console.log( '\n\nmessage', msg.data, '\n\n' );
    // }

    ws.onmessage = function ( msg ) {
        // console.log('message', msg.data);
        WSerror = msg.data.slice( 0, 2 );
        WSdata = msg.data;
        WSidMsg = msg.data.split( '{' )[0].split( ':' )[1];
        WSdata = WSdata.slice( WSdata.indexOf( '{' ) + 1 );
        // if (WSdata==="EOF"&&WSidMsg!=="product")return;
        if ( WSerror == "00" ) {
            //  if (WSidMsg == "statgs")return;
            if ( WSidMsg == "Auth" ) {
                warning( "Ошибка авторизации", 'a', 15000 );
            }
            if ( WSidMsg == "Auth" && Auth_redirect ) document.location.href = auth_page;
            console.log( 'message', msg.data );
            return;
        }
        if ( WSerror == "01" ) {
            switch ( WSidMsg ) {

                case "ordcre" :     //создать заказ
                    if ( WSdata === "EOF" ) return;
                    console.log( "Создан заказ - " + WSdata );
                    var idd = WSdata;
                    var stat = ($( "#on_time" ).is( ":checked" )) ? 1 : 2;
                    // var payName = $( "ul.pay_met .active a" ).html();
                    newOrderPersonal( idd, 0, 1 );//oper =1 courier -2
                    neworderuser( idd );
                    newOrderStatus( idd, stat );// 1-предзаказ 2- принят
                    neworderelem( idd );
                    //  newOrderPayment(idd,payName,0);
                    // var id_cl = newClientInfo( 0, 0 );
                    // newClientAddress( idd, id_cl );
                    newClientAddress( idd, 0 );
                    break;

                case "ordidd" :             // получить диапазон заказов*/
                case "ordidi" :
                    // if (WSdata==="EOF") {buildOrdersTable(); return;}
                    if ( WSdata === "EOF" ) return;
                    var stat = 2, role = 1, role1 = 2;
                    var idd = addOrderToArray2( WSdata );
                    var data1 = JSON.parse( WSdata );
                    getOrderElemAll( idd );
                    getOrderPersonalCourier( idd );
                    if ( data1.SideOrder == 2 ) getOrderPersonalCassir( idd );
                    if ( data1.SideOrder == 1 ) getOrderPersonalOperator( idd );
                    getOrderStatusFirst( idd );  //смотрим первый статус
                    getOrderStatusLast( idd, 0 );    //смотрим последний

                    getorderuser( idd );
                    // getOrderPayment(idd);
                    break;


                case "ordphone" :
                    if ( WSdata === "EOF" ) return;
                    var idd = addOrderToArrayHistory( WSdata );
                    console.log( "USERORDER_--" + WSdata );
                    var data1 = JSON.parse( WSdata );
                    getOrderElemAllHistory( idd );
                    getOrderPersonalCourierHistory( idd );
                    if ( data1.SideOrder == 2 ) getOrderPersonalCassirHistory( idd );
                    if ( data1.SideOrder == 1 ) getOrderPersonalOperatorHistory( idd );
                    getOrderStatusFirstHistory( idd );  //смотрим первый статус
                    getOrderStatusLastHistory( idd, 0 );    //смотрим последний
                    getorderuserHistory( idd );
                    break;

                case "ordliahis " :
                    if ( WSdata === "EOF" ) return;
                    addElementToArrayHistory( WSdata );
                    break;

                case "persichis" :
                    if ( WSdata === "EOF" ) return;
                    addPersToArrayCourierHistory( WSdata );
                    break;

                case "persimhis" :
                    if ( WSdata === "EOF" ) return;
                    addPersToArrayManagerHistory( WSdata );
                    break;

                case "statgshis" :
                    if ( WSdata === "EOF" ) return;
                    addFirstStatusToArrayHistory( WSdata );
                    break;  // получить конкретный статус

                case "statglhis" :
                    if ( WSdata === "EOF" ) return;
                    addLastStatusToArrayHistory( WSdata );
                    break;  // получить последний статус

                case "useridhis":
                    if ( WSdata === "EOF" ) return;
                    addUserToArrayHistory( WSdata );
                    break;   ///----Читать клиента по идентификатору заказа

                case "userid" :
                    if ( WSdata === "EOF" ) return;
                    addUserToArray( WSdata );
                    break;   ///----Читать клиента по идентификатору заказа
                case "userph2" :
                case "userph" :
                    if ( WSdata === "EOF" ) return;
                    addUserToTel( WSdata );
                    break;      /// по номеру телефона во врем структуру
                case "usercr" :
                    console.log( "Создан клиент - " + WSdata );
                    break;   //создать клиента
                case "ordlia" :
                    if ( WSdata === "EOF" ) return;
                    addElementToArray( WSdata );
                    break;   //----Считать все элементы заказа
                case "ordlid" :
                    break;                                 //элемент заказов по id idi //----Считать один элемент заказа
                case "ordlgc" :
                    break;                                 //получить число элементов заказа
                case "ordlcr" :
                    console.log( "Создан элемент заказа - " + WSdata );
                    break; //создать элемент заказа

                case "perscr" :
                    console.log( "Создан персонал - " + WSdata );
                    break;   //создать персонал
                case "persim" :
                    console.log( "Создан персонал - " + WSdata );//break;
                    if ( WSdata === "EOF" ) return;
                    addPersToArrayManager( WSdata );
                    break;
                case "persic" :
                    if ( WSdata === "EOF" ) return;
                    addPersToArrayCourier( WSdata );
                    break;
                case "persir" :
                    break;                                //получить персонал по роли и ид заказа
                case "persid" :
                    console.log( "Создан статус - " + WSdata );
                    break;                                 //получить персонал по ид заказа"
                case "statcr" :
                    console.log( "Создан статус - " + WSdata );
                    break;   //создать статус
                case "statcc" :
                    console.log( "Создан статус - " + WSdata );
                    break;    //создать статус отменен
                case "statgs" :
                    if ( WSdata === "EOF" ) return;
                    addFirstStatusToArray( WSdata );
                    break;  // получить конкретный статус
                case "statgl" :
                    if ( WSdata === "EOF" ) return;
                    addLastStatusToArray( WSdata );
                    break;  // получить последний статус

                case "payrid" :
                    addPaymentToArray( WSdata );
                    break;     // ----Читаем все оплаты одного заказа
                case "paycid" :
                    console.log( "Создана оплата - " + WSdata );
                    break;
                case "product":
                    addProduct( WSdata );
                    break;
                case "productOrg":
                    addProductOrg( WSdata );
                    break;
                case "orgcity":
                    console.log( "Создана город - " + WSdata );
                    addOrgAddressToOrg( WSdata );
                    break;
                case "delivzone":
                    console.log( "Получена зона - " + WSdata );
                    setDeliveryZonePage( WSdata );
                    break;
                case "SessionHash":
                    console.log( "Получена session info - " + WSdata );
                    setSessionInfo( WSdata );
                    break;
                case "SessionTabel":
                    console.log( "Получена session tabel - " + WSdata );
                    setSessionTabel( WSdata );
                    break;

                case "clientInfoCr":
                    console.log( "Получена clientInfoCr - " + WSdata ); //setSessionTabel(WSdata);
                    break;
                case "clientInfoUp":
                    console.log( "Получена clientInfoUp - " + WSdata ); //setSessionTabel(WSdata);
                    break;
                case "clientInfoRd":
                    if ( WSdata === "EOF" ) return;
                    addClientInfo( WSdata );
                    console.log( "Получена clientInfoRd - " + WSdata );
                    //setSessionTabel(WSdata);
                    break;
                case "clientAddressRd":
                    if ( WSdata === "EOF" ) return;
                    console.log( "Получена clientAddressRd - " + WSdata );
                    addUserToTel( WSdata );
                    break;
                case "clientAddressCr":
                    console.log( "Получена clientAddressCr - " + WSdata ); //setSessionTabel(WSdata);
                    break;

                case "status" :
                    console.log( WSdata );
                    break;
                case "Promo":
                    console.log( "Promo" + WSdata );
                    if ( WSdata === "EOF" ) {
                        Promotion._getAll();
                        return;
                    }
                    var data_1 = JSON.parse( WSdata );
                    Promotion( data_1 );
                    break;
                case "PromoType":
                    console.log( "PromoType" + WSdata );
                    if ( WSdata === "EOF" ) {
                        Promotion._getAll();
                        return;
                    }
                    var data_1 = JSON.parse( WSdata );
                    PromotionType( data_1 );
                    break;
                case "Subjects" :
                    console.log( "PromoSubjects" + WSdata );
                    if ( WSdata === "EOF" ) {
                        Promotion._getAll();
                        return;
                    }

                    var data_1 = JSON.parse( WSdata );
                    PromotionSubjects( data_1 );
                    break;

                default://console.log("Default"+WSdata);
                    break;
            }
        }

        if ( WSerror == "02" ) {
            //console.log("JSON - "+WSdata);
            var data = JSON.parse( WSdata );
            //var arr=data.Values.split(',');
            console.log( "02--" + WSdata );
            console.log( "02--" + data.Table );
            if ( data.Table !== "Order" && !orders[data.Values[0]] )return;//таблица не заказ и такого заказа нет в массиве
            switch ( data.Table ) {
                case "Order":
                    setTimeout( getorder, 4000, data.Values[0] ); //setTimeout(func, 1000, "Привет"
                    break;
                //  case "OrderCustomer": getorderuser(data.Values[0]);      break;
                case "OrderList":
                    setTimeout( getOrderElemAll, 8000, data.Values[0] );
                    break;
                case "OrderPayments":
                    break;
                case "OrderPersonal":
                    setTimeout( getOrderPersonalCourier, 8000, data.Values[0] );
                    setTimeout( getOrderPersonalOperator, 8000, data.Values[0] );
                    break; //id idi userhash hashrole
                case "OrderStatus":
                    //02:{{"Table":"OrderStatus","Query":"Create","TypeParameter":"","Values":[7,2,14,"2017-04-24T16:43:53.664741879+05:00"],
                    // "Limit":0,"Offse
                    //console.log("----upd_stat");
                    if ( data.Values[1] == 0 ) {
                        console.log( "----upd_stat" );
                        setTimeout( getOrderStatusLast, 8000, data.Values[0], data.Values[1] );
                    }
                    //else  get order status element
                    break;
            }
        }
    }
}
/////*****-----------------------------------------Order

function neworder( order ) {
    console.log( "neworder" );
    ws.send( '{"Table":"Order","Query":"Create","TypeParameter":"GetID","Values":null,"Limit":0,"Offset":0,"ID_msg":"ordcre"} ' +
        '{"ID":0,"SideOrder":1,"TimeDelivery":"' + order.time_delivery + '","DatePreOrderCook":"' + order.datepreordercook + '",' +
        '"CountPerson":' + +order.countperson + ',"Division":"' + order.division + '","NameStorage":"' + order.NameStorage + '","OrgHash":"' + order.hash_org + '","Note":"' + order.note + '",' +
        '"DiscountName":"' + order.discontname + '","DiscountPercent":' + +order.discontperc + ',"Bonus":' + order.bonus + ',"Type":"' + order.type + '","Price":' + order.price + ',' +
        '"PriceWithDiscount":' + order.pricedisc + ',"PriceCurrency":"' + order.price_currency + '","TypePayments":' + order.TypePayments + '}' );

}
//getorderdiapazon(2016-11-10T14:58:04.095037Z,getTimeOnNow());
//getorderdiapazon(getTimeToday(),getTimeOnNow());

function getorder( id ) {
//----Чтение заказа по id
    ws.send( '{"Table":"Order","Query":"Read","TypeParameter":"Value","Values":[' + id + '],"Limit":0,"Offset":0,"ID_msg":"ordidi"}' );
}

function getorderdiapazon( start, end, limit, offset ) {

//----Получить диапозон заказов по времени
    //getorderdiapazon(getTimeToday(),getTimeOnNow());
    ws.send( '{"Table":"Order","Query":"Read","TypeParameter":"RangeASC","Values":["' + start + '","' + end + '"],"Limit":' + limit + ',"Offset":' + offset + ',"ID_msg":"ordidd"}' );
    /* ----Получить диапозон по хешу организации
     {"Table":"Order","Query":"Read","TypeParameter":"Range","Values":["Доаствка",timebegin,timeend],"Limit":10,"Offset":0}*/
}

//----Получить диапазон по номеру заказчика и диапазону времени
function getordersbyphone( phone, start, end, limit, offset ) {
//getordersbyphone("79195813888",getTimeToday(),getTimeOnNow(),10,0);
    console.log( phone, start, end, limit, offset );
    $( "#orderListHistory" ).empty();
    ws.send( '{"Table":"Order","Query":"Read","TypeParameter":"RangeByPhoneCustomer","Values":["' + phone + '","' + start + '","' + end + '"],"Limit":' + limit + ',"Offset":' + offset + ',"ID_msg":"ordphone"}' );
}

///--------------------------------------------------OrderElement

function neworderelem( id ) {
    console.log( "neworderelem" );
    var price_id, pricename, typeid, typeName, ID_parent_item, parent_id,        //категория продукта
        parentName, image, units, value, set, discontname, discontperc, price,
        timeCook, CookingTracker, Composition, Additionally, Packaging, timeFry, finished = false;

    var cart1 = Cart.list;
    for ( var i = 0; i < cart1.length; i++ ) {
        price_id = cart1[i].Price_id;
        typeid = products[price_id].typeID;
        typeName = products[price_id].TypeName;
        pricename = products[price_id].name;
        price = products[price_id].Price;
        image = products[price_id].Image;
        parent_id = products[price_id].Parent_id;
        parentName = products[price_id].ParentName;
        units = products[price_id].Units;
        value = products[price_id].Value;
        set = products[price_id].Set;
        timeCook = products[price_id].TimeCook;
        timeFry = products[price_id].TimeFry;
        CookingTracker = products[price_id].CookingTracker;
        ID_parent_item = 0;
        Composition = products[price_id].Composition;
        Additionally = products[price_id].Additionally;
        Packaging = products[price_id].Packaging;
        discontname = cart1[i].DiscountName;
        discontperc = cart1[i].DiscountPercent;
        ws.send( '{"Table":"OrderList","Query":"Create","TypeParameter":"GetID","Values":null,"Limit":0,"Offset":0,"ID_msg":"ordlcr"}' +
            '{"Order_id":' + id + ',"ID_item":1,"ID_parent_item":' + ID_parent_item + ',' +
            '"Price_id":' + price_id + ',"PriceName":"' + pricename + '","Type_id":' + typeid + ',' +
            '"TypeName":"' + typeName + '","Parent_id":' + parent_id + ',"ParentName":"' + parentName + '","Image":"' + image + '",' +
            '"Units":"' + units + '","Value":' + value + ',"Set":' + set + ',"Finished":' + finished + ',' +
            '"DiscountName":"' + discontname + '","DiscountPercent":' + discontperc + ',' +
            '"Price":' + price + ',"CookingTracker":' + CookingTracker + ',"TimeCook":' + timeCook + ',"TimeFry":' + timeFry + ',' +
            '"Composition":"' + Composition + '","Additionally":"' + Additionally + '","Packaging":"' + Packaging + '"}' );
    }

}

function getOrderElemCount( id ) {
//----получить число элементов конкретного заказа
    ws.send( '{"Table":"OrderList","Query":"Read","TypeParameter":"ValueNumberCountOrderID","Values":[' + id + '],"Limit":0,"Offset":0,"ID_msg":"ordlgc"}' );
}

function gett() {
    console.log( WSdata );
}

function testGetIDCount( id ) {
    getOrderElemCount( id );
    ws.onmessage;
    console.log( WSidMsg );
}

//----Считать один элемент заказа
function getOrderElem( id, idi ) {
    ws.send( '{"Table":"OrderList","Query":"Read","TypeParameter":"Value","Values":[' + id + ',' + idi + '],"Limit":0,"Offset":0,"ID_msg":"ordlid"}' );
}

//----Считать всех элементов конкретного заказа
function getOrderElemAll( id ) {
    ws.send( '{"Table":"OrderList","Query":"Read","TypeParameter":"RangeOrderID","Values":[' + id + '],"Limit":0,"Offset":0,"ID_msg":"ordlia"}' );
}

///-------------------------------------------------------Personal

function newOrderPersonal( id, idi, role1 ) {
    console.log( "neworderpersonal" + id + ' ' + idi + ' ' + role1 );
    // idi 0 для курьера и кассира
    var userhash = SessionInfo1.UserHash,
        firstName = SessionInfo1.FirstName,
        secondName = SessionInfo1.SecondName,
        surName = SessionInfo1.SurName,
        role = SessionInfo1.RoleHash,
        roleName = SessionInfo1.RoleName;
    ws.send( '{"Table":"OrderPersonal","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0,"ID_msg":"perscr"}' +
        '{"Order_id":' + id + ',"Order_id_item":' + idi + ',"UserHash":"' + userhash + '",' +
        '"FirstName":"' + firstName + '","SecondName":"' + secondName + '","SurName":"' + surName + '",' +
        '"RoleHash":"' + role + '","RoleName":"' + roleName + '"}' );
}

function getOrderPersonal( id ) {
//----Получить всех пользователей опрделенного заказа
    ws.send( '{ "Table": "OrderPersonal", "Query": "Read","TypeParameter": "RangeOrderID","Values": [' + id + '], "Limit": 10,  "Offset": 0,"ID_msg":"persid"}' );
}

function getOrderPersonalCourier( id ) {
    var rolehash = 1;
//----Чтение всех пользователей с определнной ролью
    ws.send( '{"Table":"OrderPersonal","Query":"Read","TypeParameter":"RangeRole","Values":[' + id + ',"' + courier_hash + '"],"Limit":10,"Offset":0,"ID_msg":"persic"}' );
}

function getOrderPersonalOperator( id ) {
//----Чтение всех пользователей с определнной ролью
    var rolehash = 1;
    ws.send( '{"Table":"OrderPersonal","Query":"Read","TypeParameter":"RangeRole","Values":[' + id + ',"' + operator_hash + '"],"Limit":10,"Offset":0,"ID_msg":"persim"}' );
}
function getOrderPersonalCassir( id ) {
//----Чтение всех пользователей с определнной ролью
    var rolehash = 1;
    ws.send( '{"Table":"OrderPersonal","Query":"Read","TypeParameter":"RangeRole","Values":[' + id + ',"' + cassir_hash + '"],"Limit":10,"Offset":0,"ID_msg":"persim"}' );
}

function getOrderPersonalFirst( id, hash ) {
//----Чтение всех пользователей с определнной ролью
    var rolehash = 1;
    ws.send( '{"Table":"OrderPersonal","Query":"Read","TypeParameter":"RangeRole","Values":[' + id + ',"' + hash + '"],"Limit":10,"Offset":0,"ID_msg":"persim"}' );
}

//---------------------------------------------------------USER

function neworderuser( id ) {
    console.log( "neworderuser" );
    //$(".operator_client_adress .collapse.in")
    var city = $( "#city_client" ).val() || " ",
        name_customer = $( "#client_name" ).val() || " ",
        phone = getNumber( $( "#client_phone" ).attr( 'id' ) ),
        street = $( ".operator_client_adress .collapse.in #street_client" ).val() || " ",
        home = parseInt( $( ".operator_client_adress .collapse.in #home_number" ).val() ) || 0,
        corp = $( ".operator_client_adress .collapse.in #corp_str" ).val() || " ",
        podyezd = parseInt( $( ".operator_client_adress .collapse.in #podyezd" ).val() ) || 0,
        level = parseInt( $( ".operator_client_adress .collapse.in #level" ).val() ) || 0,
        kv = parseInt( $( ".operator_client_adress .collapse.in #kv_of" ).val() ) || 0,
        cod = $( ".operator_client_adress .collapse.in #cod" ).val() || 0,
        note = $( "#comment_order" ).val() || " ";

    ws.send( '{"Table":"OrderCustomer","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0,"ID_msg":"usercr"}' +
        '{"Order_id":' + id + ',"NameCustomer":"' + name_customer + '","Phone":"' + phone + '","Note":"' + note + '",' +
        '"City":"' + city + '","Street":"' + street + '","House":' + home + ',"Building":"' + corp + '","Floor":' + level + ',' +
        '"Apartment":' + kv + ',"Entrance":' + podyezd + ',"DoorphoneCode":"' + cod + '"}' );
}

function getorderuser( id ) {
    ws.send( '{"Table":"OrderCustomer","Query":"Read","TypeParameter":"Value","Values":[' + id + '],"Limit":0,"Offset":0,"ID_msg":"userid"}' );
}

function getorderuserbyPhone( phone ) {
//----Читать диапозон по номеру телефона
    telinfo.count = 0;
    ws.send( '{"Table":"OrderCustomer","Query":"Read","TypeParameter":"RangeByPhone","Values":["' + phone + '"],"Limit":10,"Offset":0,"ID_msg":"userph"}' );
    // ws.send('{"Table":"ClientInfo","Values":["'+phone+'"],"ID_msg":"userph2"}')
}

//----СОЗДАНИЕ ИНФОРМАЦИИ О КЛИЕНТЕ----
function newClientInfo( phone, name ) {
    var clAddress = {};
    clAddress.name_customer = $( "#client_name" ).val();
    clAddress.Phone = getNumber( $( "#client_phone" ).attr( 'id' ) );
    ws.send( ' {"Table":"ClientInfo","TypeParameter":"Create","ID_msg":"clientInfoCr"}' +
        '{"Phone":"' + clAddress.Phone + '","Name":"' + clAddress.name_customer + '"}' );
    //'{"Phone":"'+phone+'","Name":"'+name+'"}');
}

//----АПДЕЙТ КЛИЕНТА
function updClientInfo( phone, name ) {
    ws.send( '{"Table":"ClientInfo","TypeParameter":"Update","ID_msg":"clientInfoCUp"}' +
        '{"Phone":"' + phone + '","Name":"' + name + '", "Bonus":"", "BlackList":"", "CauseBlackList":"", "Birthday":""}' );

}

//----ПОЛУЧЕНИЕ ИНФОРМАЦИИ О КЛИЕНТЕ
function getClientInfo( phone ) {

    ws.send( '{"Table":"ClientInfo","TypeParameter":"ReadClient","Values":["' + phone + '"],"ID_msg":"clientInfoRd"}' );
}
//----ПОЛУЧЕНИЕ АДРЕСА КЛИЕНТА

function getClientAddress( phone ) {
    //ws.send('{"Table":"ClientInfo","TypeParameter":"ReadClient","Values":["' + phone + '"],"ID_msg":"clientInfoRd"}');
    telinfo.count = 0;
    reloadClientTel();
    ws.send( '{"Table":"ClientInfo","TypeParameter":"ReadAddress","Values":["' + phone + '"],"ID_msg":"clientAddressRd"}' );
    //{"Hash":"666","Phone":"1","Name":"Name","Password":"pass","Mail":"mail","Bonus":666,
    // "BonusWord":"bonusword","Active":false,"BlackList":true,"CauseBlackList":"косячник",
    // "Birthday":"0001-01-01T00:00:00Z","CreationTime":"2017-04-13T00:00:00Z"}
}

//----СОЗДАНИЕ ИНФОРМАЦИИ О АДРЕСЕ КЛИЕНТА
function newClientAddress( order_id, id_adr ) {
    var clAddress = {};
    clAddress.City = $( "#city_client" ).val() || " ";
    //clAddress.name_customer = $("#client_name").val();
    clAddress.Phone = getNumber( $( "#client_phone" ).attr( 'id' ) );
    //clAddress.ClientHash =$(".operator_client_adress .collapse.in").attr('data-ClientHash'));
    clAddress.Street = $( ".operator_client_adress .collapse.in #street_client" ).val() || " ";
    clAddress.House = parseInt( $( ".operator_client_adress .collapse.in #home_number" ).val() ) || 0;
    clAddress.Building = $( ".operator_client_adress .collapse.in #corp_str" ).val() || " ";
    clAddress.Entrance = parseInt( $( ".operator_client_adress .collapse.in #podyezd" ).val() ) || 0;
    clAddress.Floor = parseInt( $( ".operator_client_adress .collapse.in #level" ).val() ) || 0;
    clAddress.Apartment = parseInt( $( ".operator_client_adress .collapse.in #kv_of" ).val() ) || 0;
    clAddress.DoorphoneCode = parseInt( $( ".operator_client_adress .collapse.in #cod" ).val() ) || 0;
    clAddress.Comment = $( "#comment_order" ).val() || " ";

    //street=(street=="")?" ":street; home=(home=="")?0:home; corp=(corp=="")?0:corp;
    //podyezd=(podyezd=="")?0:podyezd; level=(level=="")?0:level; kv=(kv=="")?0:kv; cod=(cod=="")?0:cod;
    var x = $( ".operator_client_adress .collapse.in" ).parent().attr( 'data-id_address' );
    ws.send( '{"Table":"ClientInfo","TypeParameter":"CreateAddress","ID_msg":"clientAddressCr"}' +
        '{"Phone":"' + clAddress.Phone + '","Order_id":' + order_id + ', "ID":' + (x || 0) + ', ' +
        '"City":"' + clAddress.City + '", "Street":"' + clAddress.Street + '", "House":' + clAddress.House + ', "Building":"' + clAddress.Building + '",' +
        ' "Floor":' + clAddress.Floor + ', "Apartment":' + clAddress.Apartment + ', "Entrance":' + clAddress.Entrance + ', ' +
        '"DoorphoneCode":"' + clAddress.DoorphoneCode + '","Comment":"' + clAddress.Comment + '"}' );
}


///---------------------------------------------------STATUS

//    ----Создаем
function newOrderStatus( id, stat ) {
    console.log( "neworderstatus" + ' ' + id + ' ' + stat );
    var time1 = getTimeOnNow();
    //var time1="2016-11-10T14:58:04.09503701Z";
    //console.log(time1);
    ws.send( '{"Table":"OrderStatus","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0,"ID_msg":"statcr"}' +
        '{"Order_id":' + id + ',"Order_id_item":0,"Cause":"","Status_id":' + stat + ',"UserHash":"' + SessionInfo1.UserHash + '","Time":"' + time1 + '"}' );
}

//отменяем
function newOrderStatusCancel( id, cause ) {
    var time1 = getTimeOnNow();
    var stat = 16; //всегад отпр без списания
    //else stat=15;
    console.log( "Отмена  заказа " + id + ' ' + stat + ' ' + cause );
    // var qmessage='{"Table":"OrderStatus","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0,"ID_msg":"statcc"}' +
    //     '{"Order_id":'+id+',"Order_id_item":0,"Cause":"'+cause+'","Status_id":'+stat+',"UserHash":"'+SessionInfo1.UserHash+'","Time":"'+time1+'"}';
    // $.post( "http://192.168.0.73/", { userhash: SessionInfo1.UserHash, qmessage: qmessage } );

    ws.send( '{"Table":"OrderStatus","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0,"ID_msg":"statcc"}' +
        '{"Order_id":' + id + ',"Order_id_item":0,"Cause":"' + cause + '","Status_id":' + stat + ',"UserHash":"' + SessionInfo1.UserHash + '","Time":"' + time1 + '"}' );
}

function getOrderStatusFirst( id ) {
//----Читаем
    //ws.send('{"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructIDOrdIDitIDStat","Values":['+id+','+idi+','+stat+'],"Limit":0,"Offset":0,"ID_msg":"statgs"}');
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"Value","Values":[' + id + ',1],"Limit":0,"Offset":0,"ID_msg":"statgs"}' );
}

function getOrderStatusLast( id, idi ) {
//----Читаем последний статус всего заказа
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructEnd","Values":[' + id + ',' + idi + '],"Limit":0,"Offset":0,"ID_msg":"statgl"}' );
}

// ----Читаем по id заказа и id статуса заказа
// {"Table":"OrderStatus","Query":"Read","TypeParameter":"Value","Values":[14,1],"Limit":0,"Offset":0}
//
// ----Читаем последний статус всего заказа
// {"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructEnd","Values":[14],"Limit":0,"Offset":0}

////--------------------------------------------------PAYMENT

function getOrderPayment( id ) {
    // ----Читаем все оплаты одного заказа
    ws.send( '{"Table":"OrderPayments","Query":"Read","TypeParameter":"RangeOrderID","Values":[' + id + '],"Limit":100,"Offset":0,"ID_msg":"payrid"}' );

}
function newOrderPayment( id, Name, price ) {
//----Создаем оплату
    var time = getTimeOnNow();
    var hash = SessionInfo1.UserHash;
    //{"Order_id":14,"UserHash":"хеш пользователя который прнял оплату","Name":"Card","Price":123123.23,"Time":"2017-03-13T10:28:18.008969128+05:00"}

    ws.send( '{"Table":"OrderPayments","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0}' +
        '{"Order_id":' + id + ',"UserHash":"' + hash + '","Name":"' + Name + '","Price":' + price + ',"Time":"' + time + '","ID_msg":"paycid"}' );
}

///---------------------------------------------------PRODUCT

function getProduct() {
    products = {};
    Product.list = {};
    $( document ).ready( function () {
        $( '#sets .product_group' ).empty();
        $( '#rols .product_group' ).empty();
        $( '#zrols .product_group' ).empty();
        $( '#sushi .product_group' ).empty();
        $( '#pizza .product_group' ).empty().append( '<ul class="product_group"> ' +
            '<li><a href="#pizza_big" data-toggle="tab">Большая</a></li>' +
            '<li><a href="#pizza_small" data-toggle="tab">Маленькая</a></li>' );
        $( '#sous .product_group' ).empty();
        $( '#salat .product_group' ).empty();
        $( '#drink .product_group' ).empty();
        $( '#pizza_small .product_group' ).empty();
        $( '#pizza_big_t .product_group' ).empty();
        $( '#pizza_big_tr .product_group' ).empty();
    } );
    ws.send( '{"Table":"ProductOrder","ID_msg":"product"}' );

}
//---------------------------------------------ПОЛУЧЕНЕ ТОЧЕК ПО ГОРОДУ----
function getOrgbyCity() {
    ws.send( '{"Table":"GetPoint","Values":["Курган"],"ID_msg":"getorg"}' );
}
function getOrg( city ) {
    // if (city=="") return;
    Organizations = [];
    console.log( "getOrg" + city );
    ws.send( '{"Table":"GetPoint","Values":["' + city + '"],"ID_msg":"orgcity"}' );
    //ws.send('{"Table":"GetAllProduct","ID_msg":"orgcity"}');
}

function getPromoType() {
    ws.send( '{"Table":"ProductOrder","TypeParameter":"PromotionsTypes","ID_msg":"PromoType"}' );
}

function getPromo() {
    Promotion._getAllCounter = 0;
    ws.send( '{"Table":"ProductOrder","TypeParameter":"Promotions","ID_msg":"Promo"}' );
    ws.send( '{"Table":"ProductOrder","TypeParameter":"PromotionsTypes","ID_msg":"PromoType"}' );
    ws.send( '{"Table":"ProductOrder","TypeParameter":"Subjects","ID_msg":"Subjects"}' );
}

function getPromoSubjects() {
    ws.send( '{"Table":"ProductOrder","TypeParameter":"Subjects","ID_msg":"Subjects"}' );
}

function getStatus() {
    ws.send( '{"Table":"Status","Query":"Read","TypeParameter":"RangeAll","Values":null,"Limit":0,"Offset":0,"ID_msg":"status"}' );
}


function addOrderToArray2( data ) {
    var data1 = JSON.parse( data );
    if ( data1.ID == 0 ) return;
    orders[data1.ID] = {};
    orders[data1.ID].ID = data1.ID;
    orders[data1.ID].SideOrder = data1.SideOrder;
    orders[data1.ID].TimeDelivery = data1.TimeDelivery;
    orders[data1.ID].DatePreOrderCook = data1.DatePreOrderCook;
    orders[data1.ID].CountPerson = data1.CountPerson;
    orders[data1.ID].Division = data1.Division;
    orders[data1.ID].OrgHash = data1.OrgHash;
    orders[data1.ID].Note = data1.Note;
    orders[data1.ID].DiscountName = data1.DiscountName;
    orders[data1.ID].DiscountPercent = data1.DiscountPercent;
    orders[data1.ID].Bonus = data1.Bonus;
    orders[data1.ID].Type = data1.Type;
    orders[data1.ID].TypePayments = data1.TypePayments;
    orders[data1.ID].Price = data1.Price;
    orders[data1.ID].PriceWithDiscount = data1.PriceWithDiscount;
    orders[data1.ID].PriceCurrency = data1.PriceCurrency;

    var orderStr = "";
    var tempStr = "";
    for ( var i = 0; i < Organizations.length; i++ )  if ( data1.OrgHash == Organizations[i].Hash )   break; //находим организацию
    orderStr += '<tr data-toggle="collapse" class="table-operator__row" id="tr' + data1.ID + '" href="#ttr' + data1.ID + '" aria-expanded="false">' +
        '<td id="tr' + data1.ID + '_city"></td> <td class="order_number">' + data1.ID + '</td>' +
        '<td><div  id="tr' + data1.ID + '_first_stat"></div> <div  id="tr' + data1.ID + '_first_stat_time"></div></td>' +
        '<td>' + data1.Type + '<br> <span  id="tr' + data1.ID + '_first_stat_minus"></span></td>  <td>' +
        '<div id="tr' + data1.ID + '_last_stat_name"></div><div id="tr' + data1.ID + '_last_stat_time"></div>' +
        //((i<Organizations.length)?(
        '</td>  <td>' + Organizations[i].Street + ', ' + Organizations[i].House + '</td>' +
//):('</td>  <td>Неверная организация</td>'))+
        '<td><div id="tr' + data1.ID + '_cust_name"></div>   <div id="tr' + data1.ID + '_cust_phone"></div></td>' +
        '<td id="tr' + data1.ID + '_cust_address">' +
        '</td> <td><div  class="_manager" id="tr' + data1.ID + '_manager"></div>' +
        '<div>' + textVal( sideOrder[data1.SideOrder] ) + '</div></td>   <td  id="tr' + data1.ID + '_courier"></td></tr>';

    tempStr = "";

    tempStr += '<tr class="collapse table-operator__spoiler-content" id="ttr' + data1.ID + '" aria-expanded="false">' +
        '<td colspan="4">   <p class="text-upper">Состав заказа:</p> <ul>';

    if ( data1.DiscountPercent != 0 ) tempStr +=
        '<li id="ttr' + data1.ID + '_discount">     <div class="pull-right">' + Math.round( data1.Price * data1.DiscountPercent / 100 ) +
        '</div>Скидка: ' + data1.DiscountName + ' ' + data1.DiscountPercent + '% </li>';
    tempStr += '<li id="ttr' + data1.ID + '_itogo"> <div class="pull-right font_blue">' + data1.PriceWithDiscount + '</div>  К оплате  </li></ul></td>' +
        '<td colspan="3" class="text-center">' +
        '<p>Количество персон: <span class="font_blue">' + data1.CountPerson + '</span></p>' +
        '<p>Форма оплаты: <span class="font_blue" id="ttr' + data1.ID + '_payment">' + TypePayments[data1.TypePayments] + '</span></p>' +
        '<p class="text-upper">Комментарий клиента</p> <div class="font_blue" id="ttr' + data1.ID + '_cust_note"></div></td>' +
        '<td colspan="2"><p class="text-upper">Уведомления системы</p>' +
        '<div class="font_blue">' + ((data1.TimeDelivery != "0001-01-01T00:00:00Z") ? ("Предзаказ на время - " + data1.TimeDelivery + "<br>") : "") +

        ((data1.Division != " ") ? ("Обед сотрудника - " + data1.Division + "<br>") : "") + data1.Note + '</div></td>' +
        // '<td><a href="#" class="editOrder" title="" >Изменить</a>'+ //если статус доставляется
        '<td><a href="#" class="disabled" title="Действие невозможно, заказ доставляется" >Изменить</a>' + //если статус доставляется
        //'<a href="#" class="cancelCauseButton" >Отменить</a>'+
        '<a href="#" class="cancelCauseButton" data-toggle="modal" data-target="#confirm">Отменить</a></td></tr>';
    $( document ).ready( function () {
        if ( $( '#tr' + data1.ID ).length == 0 ) { //если нет такого элемента добавляем, иначе заменяем новым
            $( '#tbody1' ).prepend( tempStr ).prepend( orderStr );
        }
        else {
            $( '#tr' + data1.ID ).replaceWith( orderStr );
            $( '#ttr' + data1.ID ).replaceWith( tempStr );
        }
    } );
    $( "#active_tab a span" ).html( active_count );

    return data1.ID;
}

function addPersToArrayManager( data ) {
    var data1 = JSON.parse( data );
    if ( data1.Order_id == 0 ) return;
    orders[data1.Order_id].Order_id = data1.Order_id;
    orders[data1.Order_id].UserHashManager = data1.UserHash;
    orders[data1.Order_id].FirstNameManager = data1.FirstName;
    orders[data1.Order_id].SecondNameManager = data1.SecondName;
    orders[data1.Order_id].SureNameManager = data1.SurName;
    orders[data1.Order_id].RoleHashManager = data1.RoleHash;
    orders[data1.Order_id].RoleNameManager = data1.RoleName;
    $( "#tr" + data1.Order_id ).ready( function () {
        $( "#tr" + data1.Order_id + "_manager" ).text( (data1.SurName || " ") + " " + (data1.FirstName || " ") );
    } );
}

function addPersToArrayCourier( data ) {
    var data1 = JSON.parse( data );
    if ( data1.Order_id == 0 ) return;
    //console.log(data1);
    orders[data1.Order_id].UserHashCourier = data1.UserHash;
    orders[data1.Order_id].FirstNameCourier = data1.FirstName;
    orders[data1.Order_id].SecondNameCourier = data1.SecondName;
    orders[data1.Order_id].SureNameCourier = data1.SurName;
    orders[data1.Order_id].RoleHashCourier = data1.RoleHash;
    orders[data1.Order_id].RoleNameCourier = data1.RoleName;
    $( "#tr" + data1.Order_id ).ready( function () {
        $( "#tr" + data1.Order_id + "_courier" ).text( (data1.SurName || " ") + " " + (data1.FirstName || " ") );
    } );
}

function addFirstStatusToArray( data ) {
    var data1 = JSON.parse( data );
    //console.log(data1);
    if ( data1.Order_id == 0 ) return;
    orders[data1.Order_id].Cause_First = data1.Cause;
    orders[data1.Order_id].Status_id_First = data1.Status_id;
    orders[data1.Order_id].UserHashStatus_First = data1.UserHash;
    orders[data1.Order_id].TimeStatus_First = data1.Time;
    $( "#tr" + data1.Order_id ).ready( function () {
        $( "#tr" + data1.Order_id + "_first_stat" ).text( (Status[data1.Status_id].Name || " ") );
        $( "#tr" + data1.Order_id + "_first_stat_time" ).text( getTimeHM( data1.Time ) || " " );
        $( "#tr" + data1.Order_id + "_first_stat_minus" ).text( getTimeHMminus( data1.Time ) || " " );
    } );
}

//установка последнего статуса и перемещение по вкладкам в зависимости от этого статуса и вкладки
function addLastStatusToArray( data ) {
    var data1 = JSON.parse( data );
    if ( data1.Order_id == 0 ) return;
    orders[data1.Order_id].Cause_Last = data1.Cause;
    orders[data1.Order_id].Status_id_Last = data1.Status_id;
    orders[data1.Order_id].UserHashStatus_Last = data1.UserHash;
    orders[data1.Order_id].TimeStatus_Last = data1.Time;
    $( "#tr" + data1.Order_id ).ready( function () {
        $( "#tr" + data1.Order_id + "_last_stat_name" ).text( (Status[data1.Status_id].Name || " ") );
        $( "#tr" + data1.Order_id + "_last_stat_time" ).text( getTimeHM( data1.Time ) || " " );

        var parent = $( "#tr" + data1.Order_id ).parent()[0],
            main = $( "#tbody1" )[0],
            preorder = $( "#preOrder" )[0],
            finish = $( "#finishOrder" )[0];
        if ( data1.Status_id != 1 && parent == preorder ) {
        }
        if ( data1.Status_id == 1 && parent != preorder ) {//если вкладка не предзаказ и статус предзаказ - перенести в предзаказы
            $( "#ttr" + data1.Order_id ).detach().prependTo( $( "#orderListPre" ) );
            $( "#tr" + data1.Order_id ).detach().prependTo( $( "#orderListPre" ) );
        }
        if ( parent != main && (data1.Status_id == 14) ) {//если вкладка не активные и статус переделка - перенести в активные
            $( "#ttr" + data1.Order_id ).detach().prependTo( $( "#tbody1" ) );
            $( "#tr" + data1.Order_id ).detach().prependTo( $( "#tbody1" ) );
        }

        if ( parent != finish && (data1.Status_id == 11 || data1.Status_id == 15 || data1.Status_id == 16) ) {//если вкладка не завершенные и статус доставлен или отменен - перенести в завершенные и посчитать время выполнения заказа
            $( "#ttr" + data1.Order_id ).detach().prependTo( $( "#orderListFinish" ) );
            $( "#tr" + data1.Order_id ).detach().prependTo( $( "#orderListFinish" ) );
            $( "#tr" + data1.Order_id + "_first_stat_minus" ).text( timeMinus( getTimeHM( data1.Time ), $( "#tr" + data1.Order_id + "_first_stat_time" ).text(), 0 ) );

        }
        //обновить количество заказов на вкладках
        $( "#active_tab a span" ).html( $( "#tbody1 tr" ).length / 2 );
        $( "#done_tab a span" ).html( $( "#orderListFinish tr" ).length / 2 );
        $( "#preorder_tab a span" ).html( $( "#orderListPre tr" ).length / 2 );

    } );

}

function addUserToArray( data ) {
    //console.log(data);
    var data1 = JSON.parse( data );
    //console.log(data1);
    if ( data1.Order_id == 0 ) return;
    orders[data1.Order_id].NameCustomer = data1.NameCustomer;
    orders[data1.Order_id].Phone = data1.Phone;
    orders[data1.Order_id].NoteUser = data1.Note;
    orders[data1.Order_id].City = data1.City;
    orders[data1.Order_id].Street = data1.Street;
    orders[data1.Order_id].House = data1.House;
    orders[data1.Order_id].Building = data1.Building;
    orders[data1.Order_id].Floor = data1.Floor;
    orders[data1.Order_id].Apartment = data1.Apartment;
    orders[data1.Order_id].Entrance = data1.Entrance;
    orders[data1.Order_id].DoorphoneCode = data1.DoorphoneCode;

    $( "#tr" + data1.Order_id ).ready( function () {
        $( "#tr" + data1.Order_id + "_city" ).text( (data1.City || " ") );
        $( "#tr" + data1.Order_id + "_cust_name" ).text( (data1.NameCustomer || " ") );
        $( "#tr" + data1.Order_id + "_cust_phone" ).text( (data1.Phone || " ") );
        $( "#tr" + data1.Order_id + "_cust_address" ).text(
            (data1.Street || " ") +
            ((data1.House && data1.House != 0) ? (' д.' + (data1.House || 0) ) : " " ) +
            ((data1.Building && data1.Building != " ") ? (' стр.' + (data1.Building || " ") ) : " " ) +
            ((data1.Apartment && data1.Apartment != 0) ? (' кв.' + (data1.Apartment || 0) ) : " " ) +
            ((data1.Entrance && data1.Entrance != 0) ? (' под.' + (data1.Entrance || 0)  ) : " " ) +
            ((data1.Floor && data1.Floor != 0) ? (' эт.' + (data1.Floor || 0)  ) : " " ) +
            ((data1.DoorphoneCode && data1.DoorphoneCode != 0) ? (' код' + (data1.DoorphoneCode || 0) ) : " " )
        );
    } );

    $( "#ttr" + data1.Order_id ).ready( function () {
        $( "#ttr" + data1.Order_id + "_cust_note" ).text( (data1.Note || " ") );
    } );
}

function addUserToTel( data ) {
    console.log( "TEL-Igor----" + data );
    var data1 = JSON.parse( data );
    //  console.log(data1);
    if ( data1.Order_id == 0 ) return;
    for ( var i = 1; i <= telinfo.count; i++ ) {
        if (
            telinfo[i].City == data1.City && telinfo[i].Street == data1.Street &&
            telinfo[i].House == data1.House && telinfo[i].Building == data1.Building && telinfo[i].Floor == data1.Floor &&
            telinfo[i].Apartment == data1.Apartment && telinfo[i].Entrance == data1.Entrance &&
            telinfo[i].DoorphoneCode == data1.DoorphoneCode )
            return;
    }

    telinfo.count++;
    telinfo[telinfo.count] = {};
    telinfo[telinfo.count].NameCustomer = data1.NameCustomer || " ";
    telinfo[telinfo.count].Phone = data1.Phone || 0;
    telinfo[telinfo.count].NoteUser = data1.Note || 0;
    telinfo[telinfo.count].City = data1.City;//
    telinfo[telinfo.count].Street = data1.Street;//
    telinfo[telinfo.count].House = data1.House;//
    telinfo[telinfo.count].Building = data1.Building;//
    telinfo[telinfo.count].Floor = data1.Floor;//
    telinfo[telinfo.count].Apartment = data1.Apartment;//
    telinfo[telinfo.count].Entrance = data1.Entrance;//
    telinfo[telinfo.count].DoorphoneCode = data1.DoorphoneCode;//
    telinfo[telinfo.count].ID = data1.ID || 0;
    console.log( "123" );
    reloadClientTel();
    //"ID":49,"City":"Курган","Street":"5-й микрорайон","House":31,"Building":" ","Floor":0,"Apartment":0,
    // "Entrance":0, "DoorphoneCode":"0","Comment":" ","Phone":null,"Order_id":null
}

function addClientInfo( data ) {
    var data1 = JSON.parse( data );
    console.log( data1 );
    client_hash = data1.Hash;

}
function addElementToArray( data ) {
    var data1 = JSON.parse( data );
    //var orderlist={};
    if ( data1.Order_id == 0 ) return;
    if ( !orders[data1.Order_id].orderlist )
        orders[data1.Order_id].orderlist = {};
    orders[data1.Order_id].orderlist[data1.ID_item] = {};
    orders[data1.Order_id].orderlist[data1.ID_item].Order_id = data1.Order_id;
    orders[data1.Order_id].orderlist[data1.ID_item].ID_item = data1.ID_item;
    orders[data1.Order_id].orderlist[data1.ID_item].ID_parent_item = data1.ID_parent_item;
    orders[data1.Order_id].orderlist[data1.ID_item].Price_id = data1.Price_id;
    orders[data1.Order_id].orderlist[data1.ID_item].PriceName = data1.PriceName;
    orders[data1.Order_id].orderlist[data1.ID_item].TypeName = data1.TypeName;
    orders[data1.Order_id].orderlist[data1.ID_item].Parent_id = data1.Parent_id;
    orders[data1.Order_id].orderlist[data1.ID_item].ParentName = data1.ParentName;
    orders[data1.Order_id].orderlist[data1.ID_item].Image = data1.Image;
    orders[data1.Order_id].orderlist[data1.ID_item].Units = data1.Units;
    orders[data1.Order_id].orderlist[data1.ID_item].Value = data1.Value;
    orders[data1.Order_id].orderlist[data1.ID_item].Set = data1.Set;
    orders[data1.Order_id].orderlist[data1.ID_item].Finished = data1.Finished;
    orders[data1.Order_id].orderlist[data1.ID_item].DiscountName = data1.DiscountName;
    orders[data1.Order_id].orderlist[data1.ID_item].DiscountPercent = data1.DiscountPercent;
    orders[data1.Order_id].orderlist[data1.ID_item].Price = data1.Price;
    orders[data1.Order_id].orderlist[data1.ID_item].TimeCook = data1.TimeCook;
    orders[data1.Order_id].orderlist[data1.ID_item].TimeFry = data1.TimeFry;
    orders[data1.Order_id].orderlist[data1.ID_item].CookingTracker = data1.CookingTracker;
    orders[data1.Order_id].orderlist[data1.ID_item].Composition = data1.Composition;
    orders[data1.Order_id].orderlist[data1.ID_item].Additionally = data1.Additionally;
    orders[data1.Order_id].orderlist[data1.ID_item].Packaging = data1.Packaging;

    $( "#trr" + data1.Order_id ).ready( function () {
        var count_id = 'ttr' + data1.Order_id + '_list_' + data1.Price_id + '_' + data1.DiscountPercent;
        var count = $( "#" + count_id + "_count" ).text();
        if ( data1.ID_parent_item == 0 ) {
            if ( $( '#' + count_id ).length > 0 ) {
                $( "#" + count_id + "_count" ).text( +count + 1 );
            } else {
                var tempStr =
                    '<li id="' + count_id + '">   <div class="pull-right">' +
                    (( data1.DiscountPercent === 100) ? 0 : data1.Price) + '</div> ' +
                    data1.PriceName + ' x<span  id="' + count_id + '_count">1 </span></li>';
                if ( $( "#ttr" + data1.Order_id + "_discount" ).length > 0 ) $( "#ttr" + data1.Order_id + "_discount" ).before( tempStr );
                else $( "#ttr" + data1.Order_id + "_itogo" ).before( tempStr );
            }
        }
    } );

}


function addProduct( data ) {
    if ( data == "EOF" ) return;
    var data1 = JSON.parse( data );
    if ( !products[data1.Price_id] )
        products[data1.Price_id] = {};

    products[data1.Price_id].typeID = data1.Type_id;
    products[data1.Price_id].Type_id = data1.Type_id;
    products[data1.Price_id].TypeName = data1.TypeName;
    if ( data1.Price_id == 679 || data1.Price_id == 680 ) products[data1.Price_id].added = true;
    products[data1.Price_id].id = data1.Price_id;
    products[data1.Price_id].Price_id = data1.Price_id;
    products[data1.Price_id].name = data1.PriceName;
    products[data1.Price_id].PriceName = data1.PriceName;
    products[data1.Price_id].mass = data1.Value + ' ' + data1.Units;
    products[data1.Price_id].price = data1.Price;
    products[data1.Price_id].Price = data1.Price;
    products[data1.Price_id].description = data1.Composition;
    products[data1.Price_id].description_added = data1.Additionally;
    products[data1.Price_id].pack_info = data1.Packaging;
    if ( data1.Type_id == 14 ) products[data1.Price_id].defaultCount = 3;// для сета 3 палочки
    if ( data1.Type_id == 12 || data1.Type_id == 13 || data1.Type_id == 15 )
        products[data1.Price_id].defaultCount = 1;      //для ролов суши 1 палочка
    if ( !(data1.Type_id == 12 || data1.Type_id == 13 || data1.Type_id == 15 || data1.Type_id == 14) )
        products[data1.Price_id].defaultCount = 0;
    products[data1.Price_id].Image = data1.Image;
    products[data1.Price_id].Parent_id = data1.Parent_id;
    products[data1.Price_id].ParentName = data1.ParentName;
    products[data1.Price_id].Units = data1.Units;
    products[data1.Price_id].Value = data1.Value;
    products[data1.Price_id].Set = data1.Set;
    products[data1.Price_id].TimeCook = data1.TimeCook;
    products[data1.Price_id].TimeFry = data1.TimeFry;
    products[data1.Price_id].Composition = data1.Composition;
    products[data1.Price_id].Additionally = data1.Additionally;
    products[data1.Price_id].Packaging = data1.Packaging;
    products[data1.Price_id].ProductHash = data1.ProductHash;
    if ( data1.CookingTracker )
        products[data1.Price_id].CookingTracker = data1.CookingTracker;
    else products[data1.Price_id].CookingTracker = 0;

    if ( data1.Type_id == 12 || data1.Type_id == 13 || data1.Type_id == 14 || data1.Type_id == 15 )
        products[data1.Price_id].addeds = [679, 680];

    $( document ).ready( function () {
        if ( !(Product.list[data1.Price_id]) ) Cart.addProduct( products[data1.Price_id] );
    } );

};

function addOrgAddressToOrg( data ) {
    console.log( "getcity " + data );
    if ( data == "EOF" ) return;
    var data1 = JSON.parse( data );
    var org = [];
    org.Hash = data1.Hash;
    org.HashOrg = data1.Hash;
    org.City = data1.City;
    org.Street = data1.Street;
    org.House = data1.House;
    org.CreateTime = data1.CreateTime;
    org.CreateTimeStr = data1.CreateTimeStr;
    org.NameSklad = data1.NameSklad;
    Organizations[Organizations.length] = org;
    addOrgToPage();
}

function addPaymentToArray( data ) {
    if ( data == "EOF" ) return;
    var data1 = JSON.parse( data );
    console.log( "---- payment" + data );
    //payment{"Order_id":34,"UserHash":"23423423","Name":"Наличными","Price":0,"Time":"2017-03-22T12:05:54Z"}
    orders[data1.Order_id].PaymentUserHash = data1.UserHash;
    orders[data1.Order_id].PaymentName = data1.Name;
    orders[data1.Order_id].PaymentPrice = data1.Price;
    orders[data1.Order_id].PaymentTime = data1.Time;
    //<p>Форма оплаты: <span class="font_blue" id="ttr' +data1.ID+ '_payment">'+order.PaymentName+'</span></p>
    $( "#ttr" + data1.Order_id + "_payment" ).text( (data1.Name || " ") );
}

function getDeliveryZone( city, street, house ) {
    // ----ПОЛУЧЕНЕ ТОЧЕК ПО ЗОНЕ----
    //    ----С ДОМОМ

    for ( var i = 0; i < Organizations.length; i++ )
        if ( $( '.delivery_met.active a' ).html() === 'Доставка' && !$( "#ignore_delivery" ).is( ":checked" ) ) {
            $( '#take_away_address option[value=' + i + ']' ).attr( 'disabled', 'disabled' );
        }

    $( '#take_away_address' ).prop( 'selectedIndex', -1 );
    console.log( city + '","' + street + '","' + house );
    if ( (street == "" && house == "") || (!street && !house) ) {
        $( "#warning_dellivery" ).html( "Выберите адрес" );
        $( "#warning_dellivery" ).css( "color", "red" );
        return;
    }
    if ( city == "" || city == undefined ) {
        $( "#warning_dellivery" ).html( "Введите город" );
        $( "#warning_dellivery" ).css( "color", "red" );
        return;
    }
    if ( street == "" || street == undefined ) {
        $( "#warning_dellivery" ).html( "Введите улицу" );
        $( "#warning_dellivery" ).css( "color", "red" );
        return;
    }
    if ( house == "" || house == undefined ) {
        $( "#warning_dellivery" ).html( "Введите номер дома" );
        $( "#warning_dellivery" ).css( "color", "red" );
        return;
    }

    ws.send( ' {"Table":"GetAreas","TypeParameter":"WithHouse","Values":["' + city + '","' + street + '","' + house + '"],"ID_msg":"delivzone"}' );
    // ----БЕЗ ДОМА
    //else ws.send('{"Table":"GetAreas","TypeParameter":"NotWithHouse","Values":["'+city+'","'+street+'"],"ID_msg":"delivzone"}');
}

function setDeliveryZonePage( data ) {
    if ( data == "EOF" )return;
    var data1 = JSON.parse( data ), a = "";

    if ( data1.Exist ) {
        a = "Доставка возможна";
        $( "#warning_dellivery" ).html( a );
        $( "#warning_dellivery" ).css( "color", "green" );
        for ( var j in data1.HashList )
            for ( var i = 0; i < Organizations.length; i++ )
                if ( Organizations[i].Hash == data1.HashList[j] ) {
                    $( '#take_away_address option[value=' + i + ']' ).removeAttr( 'disabled' );// активируем
                    $( '#take_away_address' ).prop( 'selectedIndex', i );
                }
        //   else $( '#take_away_address option[value='+i+']' ).attr('disabled', 'disabled'); //деактивируем
    }
    else {
        a = "Доставка невозможна, выберите навынос";
        $( "#warning_dellivery" ).html( a );
        $( "#warning_dellivery" ).css( "color", "red" );

    }

}

function getproductOrg() {
    // $( document ).ready( function () { //обнуляет измененные свойства элементов корзины, прячет все элементы
    //     var $Items = $( '.product_group li[data-hash]' );
    //     var $Itemsa = $( '.product_group li[data-hash] a' );
    //     $Items.hide();
    //     $Itemsa.css( "color", '' );
    //
    //     $.each( $Items, function ( key, LI ) {
    //         //console.log("LI -"+$(LI).attr("onclick").indexOf("return"));
    //         if ( $( this ).attr( "onclick" ).indexOf( "return" ) >= 0 )
    //             $( this ).attr( 'onclick', $( this ).attr( 'onclick' ).slice( 13 ) );
    //     } );
    // } );
    var org_index = $( "#take_away_address option:selected" ).index(),
        hash1 = Organizations[org_index].Hash;
    console.log( hash1 );
    //var hash1="d5f702eb3d250ffe09d8a16677015f450290242dfb86db14231806abaa315951a4d900ecc8ea42bb864f8b4bad51fdb480d192605da599ab2462eba9d414f6c0";
    ws.send( '{"Table":"ProductOrder","TypeParameter":"OrgHash","Values":["' + hash1 + '"],"ID_msg":"productOrg"}' );
}

// $( "#take_away_address" ).on( "change", function () {
//option:selected
//  var org_index=get
// } )


// function addProductOrg( data ) {
//
//     console.log( data );
//     if ( data == "EOF" ) return;
//     var data1 = JSON.parse( data );
//
//     $( document ).ready( function () { //отображает элементы с полученым хешем
//         var $Items = $( ".tab-pane .product_group li a:not(.part)" );
//         var $filterItems = $Items.filter( function () {
//             var value = data1.ProdHash;
//             var value2 = $( this ).parent().attr( "data-hash" );
//             if ( value == value2 ) {
//                 if ( data1.StopList == true ) {
//                     $( this ).css( "color", "red" );
//                     $( this ).parent().attr( 'onclick', "return false;" + $( this ).parent().attr( 'onclick' ) );
//                 }
//                 return true;
//             } ///TODO -------------------------------------------------
//         } );
//         //отображает отфтльтрованные
//         $filterItems.parent().show();
//     } );
// }

// if ( false ) {
function addProductOrg( data ) {
    console.log( data );
    if ( data == "EOF" ) return;
    var data1 = JSON.parse( data )
        , el = document.querySelector( 'li[data-hash="' + data1.ProdHash + '"]' );
    if ( el !== null ) {
        if ( data1.StopList ) {
            el.classList.add( 'stop_list_product' );
        } else {
            el.classList.remove( 'stop_list_product' );
        }
    }
}
// }

function getSessionHash() {
    //var hash=SessionInfo1.SessionHash;
    //ws.send('{"Table":"Session","TypeParameter":"Read","ID_msg":"SessionHash"}');
    ws.send( '{"Table":"Session","TypeParameter":"ReadNotRights","ID_msg":"SessionHash"}' );

    // {"Table":"Tabel","Values":["UserHash"],"ID_msg":""}
}

function setSessionInfo( data ) {
    // console.log(data);
    var data1 = JSON.parse( data );
    SessionInfo1.FirstName = data1.FirstName;
    SessionInfo1.SecondName = data1.SecondName;
    SessionInfo1.SurName = data1.SurName;
    SessionInfo1.RoleHash = data1.RoleHash;
    SessionInfo1.RoleName = data1.RoleName;
    SessionInfo1.UserHash = data1.UserHash;
    SessionInfo1.VPNNumber = data1.VPNNumber;
    SessionInfo1.VPNPassword = data1.VPNPassword;
    SessionInfo1.Language = data1.Language;
    SessionInfo1.OrganizationHash = data1.OrganizationHash;
    SessionInfo1.OrganizationName = data1.OrganizationName;
    SessionInfo1.Rights = data1.Rights;
    SessionInfo1.SkladName = data1.SkladName;
    SessionInfo1.SessionData = data1.SessionData;
    SessionInfo1.Begin = data1.Begin;
    SessionInfo1.End = data1.End;
    ws.send( '{"Table":"Tabel","Values":["' + SessionInfo1.UserHash + '"],"ID_msg":"SessionTabel"}' );
    setupSessionInfo();

}

function setSessionTabel( data ) {
    //console.log(data);
    var data1 = JSON.parse( data );

    user_stat.PlanTime = data1.PlanTime;
    user_stat.JobTime = data1.JobTime;

}

//$(document).on("click","#logout", function () {
$( "#logout" ).click( function () {
    //закрыть сессию
    //перейти на yapoki
    ws.send( '{"Table":"Session","TypeParameter":"Abort","ID_msg":"SessionTabel"}' );
    document.location.href = auth_page;
} );


function warning( txt, alert, time, except ) {
    // txt - выводимый текст, alert - тип(null, 'i', 'a' разные по цветам)
    //warning("Подключение",'i');
    // , time - время на которое показывается  //false милисекунды
    // , except - id сообщения которое нужно удалить при появлении создаваемого
    // возвращает id сообщения.
    var i, cl = '', id = Math.floor( Math.random() * 1000000 ), id_elem = 'id="' + id + '"',
        dublicate = $( 'button:contains(' + txt + ')' );
    switch ( alert ) {
        case 'a':
            cl = 'class="alert"';
            break;
        case 'i':
            cl = 'class="info"';
            break;
    }
    if ( except ) {
        if ( !Array.isArray( except ) ) {
            $( '#' + except ).remove();
        } else {
            for ( i in except ) {
                $( '#' + except[i] ).remove();
            }
        }
    }
    if ( time ) {
        setTimeout( function () {
            $( '#' + id ).remove()
        }, time );
    }

    dublicate.remove();
    document.getElementById( 'warning' ).innerHTML += '<button ' + id_elem + ' ' + cl + ' >' + txt + '</button>';
    return id;
}

warning.del = function ( id ) {
    $( '#' + id ).remove()
};

$( document ).on( 'click', '#warning button', function () {
    $( this ).remove();
} );


///--------------------------------------------HISTORY

function addOrderToArrayHistory( data ) {
    var data1 = JSON.parse( data );
    if ( data1.ID == 0 ) return;


    var orderStr = "";
    var tempStr = "";
    for ( var i = 0; i < Organizations.length; i++ )  if ( data1.OrgHash == Organizations[i].Hash )   break;
    orderStr += '<tr data-toggle="collapse" class="table-operator__row" id="tr' + data1.ID + '_his" href="#ttr' + data1.ID + '_his" aria-expanded="false">' +
        '<td id="tr' + data1.ID + '_city_his"></td> <td class="order_number_his">' + data1.ID + '</td>' +
        '<td><div  id="tr' + data1.ID + '_first_stat_his"></div> <div  id="tr' + data1.ID + '_first_stat_minus_his"></div></td>' +
        '<td>' + data1.Type + '</td>  <td>' +
        '<div id="tr' + data1.ID + '_last_stat_name_his"></div><div id="tr' + data1.ID + '_last_stat_time_his"></div>' +
        //((i<Organizations.length)?
        //(
        '</td>  <td>' + Organizations[i].Street + ', ' + Organizations[i].House + '</td>' +
//):('</td>  <td>Неверная организация</td>'))+
        '<td><div id="tr' + data1.ID + '_cust_name_his"></div>   <div id="tr' + data1.ID + '_cust_phone_his"></div></td>' +
        '<td id="tr' + data1.ID + '_cust_address_his">' +
        '</td> <td><div  class="_manager" id="tr' + data1.ID + '_manager_his"></div>' +
        '<div>' + textVal( sideOrder[data1.SideOrder] ) + '</div></td>   <td  id="tr' + data1.ID + '_courier_his"></td></tr>';

    tempStr = "";

    tempStr += '<tr class="collapse table-operator__spoiler-content" id="ttr' + data1.ID + '_his" aria-expanded="false">' +
        '<td colspan="4">   <p class="text-upper">Состав заказа:</p>' +
        ' <ul>';

    if ( data1.DiscountPercent != 0 ) tempStr +=
        '<li id="ttr' + data1.ID + '_discount_his">     <div class="pull-right">' + Math.round( data1.Price * data1.DiscountPercent / 100 ) +
        '</div>Скидка: ' + data1.DiscountName + ' ' + data1.DiscountPercent + '% </li>';
    tempStr += '<li id="ttr' + data1.ID + '_itogo_his"> <div class="pull-right font_blue">' + data1.PriceWithDiscount + '</div>  К оплате  </li></ul></td>' +
        '<td colspan="3" class="text-center">' +
        '<p>Количество персон: <span class="font_blue">' + data1.CountPerson + '</span></p>' +
        '<p>Форма оплаты: <span class="font_blue" id="ttr' + data1.ID + '_payment_his">' + TypePayments[data1.TypePayments] + '</span></p>' +
        '<p class="text-upper">Комментарий клиента</p>' +
        '<div class="font_blue" id="ttr' + data1.ID + '_cust_note_his"></div></td>' +
        '<td colspan="2"><p class="text-upper">Уведомления системы</p>' +
        '<div class="font_blue">' + ((data1.TimeDelivery != "0001-01-01T00:00:00Z") ? ("Предзаказ на время - " + data1.TimeDelivery + "<br>") : "") +

        ((data1.Division != " ") ? ("Обед сотрудника - " + data1.Division + "<br>") : "") + data1.Note + '</div></td>' +
        '<td>' +  ////действия над заказом удалить....
        '</td></tr>';
    $( document ).ready( function () {
        if ( $( '#tr' + data1.ID + '_his' ).length == 0 ) { //если нет такого элемента добавляем, иначе заменяем новым
            $( '#orderListHistory' ).prepend( tempStr ).prepend( orderStr );
        }
        else {
            $( '#tr' + data1.ID + '_his' ).replaceWith( orderStr );
            $( '#ttr' + data1.ID + '_his' ).replaceWith( tempStr );
        }
    } );
    //$("#active_tab a span").html(active_count);

    return data1.ID;
}


function addUserToArrayHistory( data ) {
    var data1 = JSON.parse( data );
    if ( data1.Order_id == 0 ) return;

    $( "#tr" + data1.Order_id + '_his' ).ready( function () {
        $( "#tr" + data1.Order_id + "_city_his" ).text( (data1.City || " ") );
        $( "#tr" + data1.Order_id + "_cust_name_his" ).text( (data1.NameCustomer || " ") );
        $( "#tr" + data1.Order_id + "_cust_phone_his" ).text( (data1.Phone || " ") );
        $( "#tr" + data1.Order_id + "_cust_address_his" ).text(
            (data1.Street || " ") +
            ((data1.House && data1.House != 0) ? (' д.' + (data1.House || 0) ) : " " ) +
            ((data1.Building && data1.Building != " ") ? (' стр.' + (data1.Building || " ") ) : " " ) +
            ((data1.Apartment && data1.Apartment != 0) ? (' кв.' + (data1.Apartment || 0) ) : " " ) +
            ((data1.Entrance && data1.Entrance != 0) ? (' под.' + (data1.Entrance || 0)  ) : " " ) +
            ((data1.Floor && data1.Floor != 0) ? (' эт.' + (data1.Floor || 0)  ) : " " ) +
            ((data1.DoorphoneCode && data1.DoorphoneCode != 0) ? (' код' + (data1.DoorphoneCode || 0) ) : " " )
        );
    } );

    $( "#ttr" + data1.Order_id + '_his' ).ready( function () {
        $( "#ttr" + data1.Order_id + "_cust_note_his" ).text( (data1.Note || " ") );
    } );
}

function addElementToArrayHistory( data ) {
    var data1 = JSON.parse( data );
    //var orderlist={};
    if ( data1.Order_id == 0 ) return;
    $( "#trr" + data1.Order_id + '_his' ).ready( function () {
        var count_id = 'ttr' + data1.Order_id + '_list_' + data1.Price_id + '_' + data1.DiscountPercent;
        var count = $( "#" + count_id + "_count_his" ).text();
        if ( data1.ID_parent_item == 0 ) {
            if ( $( '#' + count_id ).length > 0 ) {
                $( "#" + count_id + "_count_his" ).text( +count + 1 );
            } else {
                var tempStr =
                    '<li id="' + count_id + '">   <div class="pull-right">' +
                    (( data1.DiscountPercent === 100) ? 0 : data1.Price) + '</div> ' +
                    data1.PriceName + ' x<span  id="' + count_id + '_count"> 1 </span></li>';
                if ( $( "#ttr" + data1.Order_id + "_discount_his" ).length > 0 ) $( "#ttr" + data1.Order_id + "_discount_his" ).before( tempStr );
                else $( "#ttr" + data1.Order_id + "_itogo_his" ).before( tempStr );
            }
        }
    } );
}


function addPersToArrayManagerHistory( data ) {
    var data1 = JSON.parse( data );
    if ( data1.Order_id == 0 ) return;

    $( "#tr" + data1.Order_id + '_his' ).ready( function () {
        $( "#tr" + data1.Order_id + "_manager_his" ).text( (data1.SurName || " ") + " " + (data1.FirstName || " ") );
    } );
}

function addPersToArrayCourierHistory( data ) {
    var data1 = JSON.parse( data );
    if ( data1.Order_id == 0 ) return;

    $( "#tr" + data1.Order_id + '_his' ).ready( function () {
        $( "#tr" + data1.Order_id + "_courier_his" ).text( (data1.SurName || " ") + " " + (data1.FirstName || " ") );
    } );
}

function addFirstStatusToArrayHistory( data ) {
    var data1 = JSON.parse( data );
    //console.log(data1);
    if ( data1.Order_id == 0 ) return;

    $( "#tr" + data1.Order_id + '_his' ).ready( function () {
        $( "#tr" + data1.Order_id + "_first_stat_his" ).text( (Status[data1.Status_id].Name || " ") );
        $( "#tr" + data1.Order_id + "_first_stat_minus_his" ).text( getTimeHM( data1.Time ) || " " );
    } );
}

function addLastStatusToArrayHistory( data ) {
    var data1 = JSON.parse( data );
    if ( data1.Order_id == 0 ) return;

    $( "#tr" + data1.Order_id + '_his' ).ready( function () {
        $( "#tr" + data1.Order_id + "_last_stat_name_his" ).text( (Status[data1.Status_id].Name || " ") );
        $( "#tr" + data1.Order_id + "_last_stat_time_his" ).text( getTimeHM( data1.Time ) || " " );

    } );

}


function getOrderElemAllHistory( id ) {
    ws.send( '{"Table":"OrderList","Query":"Read","TypeParameter":"RangeOrderID","Values":[' + id + '],"Limit":0,"Offset":0,"ID_msg":"ordliahis"}' );
}
function getOrderPersonalCourierHistory( id ) {
    ws.send( '{"Table":"OrderPersonal","Query":"Read","TypeParameter":"RangeRole","Values":[' + id + ',"' + courier_hash + '"],"Limit":10,"Offset":0,"ID_msg":"persichis"}' );
}
function getOrderPersonalOperatorHistory( id ) {
    ws.send( '{"Table":"OrderPersonal","Query":"Read","TypeParameter":"RangeRole","Values":[' + id + ',"' + operator_hash + '"],"Limit":10,"Offset":0,"ID_msg":"persimhis"}' );
}
function getOrderPersonalCassirHistory( id ) {
    ws.send( '{"Table":"OrderPersonal","Query":"Read","TypeParameter":"RangeRole","Values":[' + id + ',"' + cassir_hash + '"],"Limit":10,"Offset":0,"ID_msg":"persimhis"}' );
}
function getOrderStatusFirstHistory( id ) {
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"Value","Values":[' + id + ',1],"Limit":0,"Offset":0,"ID_msg":"statgshis"}' );
}
function getOrderStatusLastHistory( id, idi ) {//----Читаем последний статус всего заказа
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructEnd","Values":[' + id + ',' + idi + '],"Limit":0,"Offset":0,"ID_msg":"statglhis"}' );
}
function getorderuserHistory( id ) {
    ws.send( '{"Table":"OrderCustomer","Query":"Read","TypeParameter":"Value","Values":[' + id + '],"Limit":0,"Offset":0,"ID_msg":"useridhis"}' );
}

