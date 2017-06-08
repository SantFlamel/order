var trackers = {
    1: "Сушимейкер",
    2: "Раскатка",
    3: "Начинение",
    4: "Упаковка"
};

var SYSTIME = "00:00:00"

var SessionInfo1 = {};

var user_stat = {
    WorkHours: 0,             //Часы с нач.мес.: 148
    MakeToday: 0,               //Сегодня изделий: 63
    MakeMounth: 0,           //Изделия с нач.мес.: 2101
    TimeGetMedium: "0",       //Среднее время принятие заказа: 1:15
    Rating: 0,                  //Рейтинг: 95
    BalansMinus: 0,          //Списания: 3 552
    Balans: 0               //Баланс: 15 451
};

var tracker = $.cookie( 'tracker' ) || 1;
//$(".dropdown-toggle.user_role option:selected").index()=tracker-1;
$( '.dropdown-toggle.user_role' ).prop( 'selectedIndex', tracker - 1 );

$( ".order_item" ).hide();
$( ".button_cancel" ).hide();

var hash = $.cookie( 'hash' );
SessionInfo1.SessionHash = hash;

var products = {};
var OrderL = {}, activeOrder = {};

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

function newWS() {
    console.log( 'not open' );
    ws = new WebSocket( addressWS );
    ;
    ws.onopen = function () {
        console.log( 'open' );
        warning( "Подключено", 'i', 5000 );
        // ws.send('hashauth:'+SessionInfo1.SessionHash);
        console.log( '{"HashAuth":"' + SessionInfo1.SessionHash + '"}' );
        ws.send( '{"HashAuth":"' + SessionInfo1.SessionHash + '"}' );
        setTimeout( "if (ws.readyState == 1) getSessionHash()", 1000 );
        if ( ws.readyState == 1 ) getSystemTime();
        console.log( ws.readyState );
        getOrderL();
    };
    ws.onerror = function ( e ) {
        warning( "Ошибка подключения", 'a', 5000 );
        return function () {
            console.log( 'error:', e );
        }
    };
    ws.onclose = function () {
        warning( "Подключение закрыто", 'a', 5000 );
        console.log( 'close' );
        setTimeout( newWS, 5000 );
    };
    ws.onmessage = function ( msg ) {

        WSerror = msg.data.slice( 0, 2 ),
            WSdata = msg.data,
            WSidMsg = msg.data.split( '{' )[0].split( ':' )[1];
        WSdata = WSdata.slice( WSdata.indexOf( '{' ) + 1 );

        if ( WSerror == "00" ) {
            //console.log('message', msg.data);
            if ( WSidMsg == "statgs" )return;
            if ( WSidMsg == "getstat" )return;
            if ( WSidMsg == "getstato" )return;
            if ( WSidMsg == "Auth" ) {
                warning( "Ошибка авторизации", 'a', 15000 );
            }
            if ( WSidMsg == "Auth" && Auth_redirect ) {
                document.location.href = auth_page;
            }
            console.error( 'message', msg.data );
            return;
        }

        if ( WSerror == "01" )
            switch ( WSidMsg ) {
                case "getelem" :
                    //console.log("Создан заказ - " + WSdata);
                    if ( WSdata === "EOF" )  return;
                    var idd = addOrderL( WSdata );
                    // getStatusI(idd);
                    // getStatusO(idd);
                    //  getOrderStatus(idd,0,1);  //смотрим предзаказ
                    //  getOrderStatus(idd,0,2);
                    getOrderStatusFirst( idd );  //смотрим первый статус
                    getTimer( idd );
                    break;
                case "actorder" :
                    var idd = addActiveOrder( WSdata );
                    getOrderStatusActive( idd );
                    break;
                case "getstat" :
                    addStatusToArray( WSdata );
                    break;
                case "getstato" :
                    addStatusToArrayO( WSdata );
                    break;
                case "getactstat":
                    addActiveStatus( WSdata );
                    break;
                case "updactstat":
                    updActiveStatus( WSdata );
                    break;
                case "makefinished":
                    break;
                case "getpers" :
                    addPersonalToArray( WSdata );
                    break;
                case "sendstat" :
                    break;
                case "sendstat1":
                    break;
                case "sendstat2":
                    break;
                case "sendstat3":
                    break;
                case "cancelstat":
                    break;

                case "sendpers" :
                    break;
                case "statgs" :
                    if ( WSdata === "EOF" ) return;
                    console.log( "statgs" );
                    addFirstStatusToArray( WSdata );
                    addOrderToTable1();
                    break;

                case "product":
                    addProduct( WSdata );
                    break;
                case "orgcity":
                    addOrgAddressToOrg( WSdata );
                    break;
                case "status" :
                    console.log( WSdata );
                    break; //TODO загрузка статусов
                case "SessionHash":
                    console.log( "Получена session info - " + WSdata );
                    setSessionInfo( WSdata );
                    break;
                case "SessionTabel":
                    console.log( "Получена session tabel - " + WSdata );
                    setSessionTabel( WSdata );
                    break;
                case "localtime":
                    if ( WSdata.length == 8 ) SETSYSTIME( WSdata );
                    console.log( WSdata );
                    break;
                case "gettimer":   //console.log("Получен timer - " + WSdata);
                    addTimer( WSdata );
                    break;
                case "cretimer":
                    console.log( "Получен cretimer - " + WSdata );
                    break;
                case "fintimer":
                    console.log( "Получен fintimer - " + WSdata );
                    break;
                    break;
                default://console.log("Default"+WSdata);
                    break;
            }

        if ( WSerror == "02" ) {
            console.log( 'message', msg.data );
            var data = JSON.parse( WSdata );
            //if(data.Table!=="Order"&&!orders[data.Values[0]])return;//таблица не заказ и такого заказа нет в массиве
            if ( data.ID_msg == SessionInfo1.OrganizationHash )
                switch ( data.Table ) {
                    // case "Order":        getorder(data.Values[0]);       break;
                    // case "OrderCustomer": getorderuser(idd);      break;
                    case "OrderList":
                        getOrderL(); //getOrderElemAll(idd);
                        // $("#sound").click();
                        break;
                    // case "OrderPayments":
                    // case "OrderPersonal":

                    case "OrderStatus":
                        // for(var k=1;k<=OrderL.length;k++) if
                        //if((data.Values[2]==6||data.Values[2]==7)&&(tracker==3||tracker==4))return;//нужны статусы только
                        //  if (data.Values[2]!=6&&data.Values[2]!=7&&tracker!=3&&tracker!=4)return;
                        // else
                        if ( data.Values[2] != 14 && data.Values[2] != 15 && data.Values[2] != 16 && data.Values[2] != 4 && data.Values[2] != 6 && data.Values[2] != 7 )
                            return;//нужны статусы только

                        /// /если приходит обновление для активного элемента, запрашиваю статус для всего заказа
                        for ( var i = 1; i <= OrderL.count; i++ ) if ( OrderL[i].Order_id == data.Values[0] ) getOrderL();
                        if ( data.Values[0] == activeOrder.Order_id && data.Values[1] == activeOrder.ID_item ) {
                            updOrderStatusActive( data.Values[0], 0 );
                            getOrderL();
                        }//TODO
                        if ( data.Values[2] == 14 ) getOrderL();
                        if ( (data.Values[2] == 5 || data.Values[2] == 6 || data.Values[2] == 7) && (tracker == 3 || tracker == 4) ) getOrderL();
                        //     //else  get order status element
                        //TODO если в активном заказе и статус отменен модалька - отменен - отменить со списанием
                        break;
                }
        }
    }
}


//--------------------------------------ORDERL-------------------------------------

function getOrderL() {       //получить элементы заказа 6 штук
    $( document ).ready( function () {
        $( ".order_table" ).empty();
    } );
    if ( tracker == 2 ) {
        getPizzaLS( 5 );
        return
    }
    if ( tracker == 3 ) {
        getPizzaLS( 6 );
        return
    }
    if ( tracker == 4 ) {
        getPizzaLS( 7 );
        return
    }
    var hashorg = SessionInfo1.OrganizationHash,
        time = getTimeOnNow(), //TODO --------что это такое
        userhash = SessionInfo1.UserHash,
        limit = 6;
    clearOrderL();
    ws.send( '{"Table":"OrderList","Query":"Read","TypeParameter":"RangeForCook",' +
        '"Values":["' + hashorg + '","' + time + '",' + tracker + ',"' + userhash + '"],"Limit":' + limit + ',"Offset":0,"ID_msg":"getelem"}' );
}

function getPizzaL() {       //получить элементы заказа 6 штук
    var hashorg = SessionInfo1.OrganizationHash,
        time = getTimeOnNow(), //TODO --------что это такое
        userhash = SessionInfo1.UserHash,
        limit = 6;
    clearOrderL();
    ws.send( '{"Table":"OrderList","Query":"Read","TypeParameter":"RangePizzaMaker",' +
        '"Values":["' + hashorg + '","' + time + '"],"Limit":' + limit + ',"Offset":0,"ID_msg":"getelem"}' );
}

function getPizzaLS( stat ) { //----Читать Все элементы заказа для пицце мейкера где статус
    var hashorg = SessionInfo1.OrganizationHash,
        time = getTimeOnNow(), //TODO --------что это такое
        userhash = SessionInfo1.UserHash,
        limit = 6;
    clearOrderL();
    ws.send( '{"Table":"OrderList","Query":"Read","TypeParameter":"RangeWithStatus",' +
        '"Values":["' + hashorg + '","' + time + '",' + tracker + ',' + stat + ',"' + userhash + '"],"Limit":' + limit + ',"Offset":0,"ID_msg":"getelem"}' );
}

function clearOrderL() {
    OrderL = {};
    OrderL.count = 0;
}

function addOrderL( data ) {      //добавить элементы заказа в массив
    var data1 = JSON.parse( data );
    OrderL.count++;
    OrderL[OrderL.count] = {};
    OrderL[OrderL.count].Order_id = data1.Order_id;
    OrderL[OrderL.count].ID_item = data1.ID_item;
    OrderL[OrderL.count].ID_parent_item = data1.ID_parent_item;
    OrderL[OrderL.count].Price_id = data1.Price_id;
    OrderL[OrderL.count].PriceName = data1.PriceName;
    OrderL[OrderL.count].TypeName = data1.TypeName;
    OrderL[OrderL.count].Parent_id = data1.Parent_id;
    OrderL[OrderL.count].ParentName = data1.ParentName;
    OrderL[OrderL.count].Image = data1.Image;
    OrderL[OrderL.count].Units = data1.Units;
    OrderL[OrderL.count].Value = data1.Value;
    OrderL[OrderL.count].Set = data1.Set;
    OrderL[OrderL.count].Finished = data1.Finished;
    OrderL[OrderL.count].DiscountName = data1.DiscountName;
    OrderL[OrderL.count].DiscountPercent = data1.DiscountPercent;
    OrderL[OrderL.count].Price = data1.Price;
    OrderL[OrderL.count].TimeCook = data1.TimeCook;
    OrderL[OrderL.count].TimeFry = data1.TimeFry;
    OrderL[OrderL.count].CookingTracker = data1.CookingTracker;
    return data1.Order_id + '-' + data1.ID_item;
}

function getOrderActive( id, idi ) {
//----Считать один элемент заказа
    ws.send( '{"Table":"OrderList","Query":"Read","TypeParameter":"Value","Values":[' + id + ',' + idi + '],"Limit":0,"Offset":0,"ID_msg":"actorder"}' );
}
function addActiveOrder( data ) {
    var data1 = JSON.parse( data );
    //OrderL.count++;
    //OrderL[OrderL.count]={};
    activeOrder.Order_id = data1.Order_id;
    activeOrder.ID_item = data1.ID_item;
    activeOrder.ID_parent_item = data1.ID_parent_item;
    activeOrder.Price_id = data1.Price_id;
    activeOrder.PriceName = data1.PriceName;
    activeOrder.TypeName = data1.TypeName;
    activeOrder.Parent_id = data1.Parent_id;
    activeOrder.ParentName = data1.ParentName;
    activeOrder.Image = data1.Image;
    activeOrder.Units = data1.Units;
    activeOrder.Value = data1.Value;
    activeOrder.Set = data1.Set;
    activeOrder.Finished = data1.Finished;
    activeOrder.DiscountName = data1.DiscountName;
    activeOrder.DiscountPercent = data1.DiscountPercent;
    activeOrder.Price = data1.Price;
    activeOrder.TimeCook = data1.TimeCook;
    activeOrder.TimeFry = data1.TimeFry;
    activeOrder.CookingTracker = data1.CookingTracker;
    //$("#in_work").attr("data-timer-stat");
    $( "#imgOrder" ).attr( 'src', data1.Image );
    timeMinus
    // console.log( time_second2( data1.TimeCook ) );
    // console.log( $( "#in_work" ).attr( "data-timer-stat" ) );
    // console.log( getTimeNow1( 0 ) );
    // console.log( timeMinus( getTimeNow1( 0 ), $( "#in_work" ).attr( "data-timer-stat" ), 0 ) );
    // console.log( timeMinus( timeMinus( getTimeNow1( 0 ), $( "#in_work" ).attr( "data-timer-stat" ), 0 ), SYSTIME, 0 ) );
    // console.log( timeMinus( time_second2( data1.TimeCook ), timeMinus( timeMinus( getTimeNow1( 0 ), $( "#in_work" ).attr( "data-timer-stat" ), 0 ), SYSTIME, 0 ), 0 ) );
    // //console.log(timeMinus(timeMinus(time_second2 (data1.TimeCook), timeMinus(getTimeNow1(0),$("#in_work").attr("data-timer-stat"),0),0));

    if ( $( "#in_work" ).attr( "data-timer-stat" ) != "0001-01-01T00:00:00Z" ) $( "#in_work" ).html( timeMinus( time_second2( data1.TimeCook ), timeMinus( timeMinus( getTimeNow1( 0 ), $( "#in_work" ).attr( "data-timer-stat" ), 0 ), SYSTIME, 0 ), 0 ) );
    // else $("#in_work").html (timeMinus(time_second2 (data1.TimeCook),SYSTIME,0));
    else $( "#in_work" ).html( time_second2( data1.TimeCook ) );
    return data1.Order_id + '-' + data1.ID_item;
}
//--------------------------------------STATUS-------------------------------------

function getStatusI( idd ) {    //----Читаем последний статус по id заказа и id элемента заказа

    var id = idd.split( '-' ); // return data1.Order_id+'-'+data1.ID_item;
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructIDOrdIDit",' +
        '"Values":[' + id[0] + ',' + id[1] + '],"Limit":0,"Offset":0,"ID_msg":"getstat"}' );
}

function getStatusO( idd ) { //----Читаем последний статус по id заказа
    var id = idd.split( '-' );  // return data1.Order_id+'-'+data1.ID_item;
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructIDOrdIDit",' +
        '"Values":[' + id[0] + ',0],"Limit":0,"Offset":0,"ID_msg":"getstato"}' );
}

function addStatusToArray( data ) {
    var data1 = JSON.parse( data );
    //console.log(data1);
    for ( var i = 1; i <= OrderL.count; i++ ) {
        if ( data1.Order_id == OrderL[i].Order_id && OrderL[i].ID_item == data1.Order_id_item ) {
            OrderL[i].Cause_Last = data1.Cause;
            OrderL[i].Status_id_Last = data1.Status_id;
            OrderL[i].UserHashStatus_Last = data1.UserHash;
            OrderL[i].TimeStatus_Last = data1.Time;
        }
    }
}

//TODO проверить вроде неправитьно работает
function addStatusToArrayO( data ) { //статус по id заказа, если статус элемента пустой
    var data1 = JSON.parse( data );
    //console.log(data1);
    for ( var i = 1; i <= OrderL.count; i++ ) {
        if ( data1.Order_id == OrderL[i].Order_id && !(OrderL[i].Status_id_Last) ) {
            OrderL[i].Cause_Last = data1.Cause;
            OrderL[i].Status_id_Last = data1.Status_id;
            OrderL[i].UserHashStatus_Last = data1.UserHash;
            OrderL[i].TimeStatus_Last = data1.Time;
        }
    }
}


function sendStatus1( id, idi, stat ) {
    console.log( "neworderstatus" + ' ' + id + ' ' + idi + ' ' + stat );
    var time1 = getTimeOnNow();
    //{"Table":"OrderStatus","Query":"Create","TypeParameter":"GetError","Values":null,"Limit":0,"Offset":0}

    ws.send( '{"Table":"OrderStatus","Query":"Create","TypeParameter":"GetError","Values":null,"Limit":0,"Offset":0,"ID_msg":"sendstat1"}' +
        '{"Order_id":' + id + ',"Order_id_item":' + idi + ',"Cause":"","Status_id":' + stat + ',"UserHash":"' + SessionInfo1.UserHash + '","Time":"' + time1 + '"}' );
}

function sendStatus2( id, idi, stat ) {
    console.log( "neworderstatus" + ' ' + id + ' ' + idi + ' ' + stat );
    var time1 = getTimeOnNow();
    ws.send( '{"Table":"OrderStatus","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0,"ID_msg":"sendstat2"}' +
        '{"Order_id":' + id + ',"Order_id_item":' + idi + ',"Cause":"","Status_id":' + stat + ',"UserHash":"' + SessionInfo1.UserHash + '","Time":"' + time1 + '"}' );

}
function sendStatus3( id, idi, stat, cause ) {
    console.log( "neworderstatus" + ' ' + id + ' ' + idi + ' ' + stat + ' ' + cause );
    var time1 = getTimeOnNow();
    ws.send( '{"Table":"OrderStatus","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0,"ID_msg":"sendstat3"}' +
        '{"Order_id":' + id + ',"Order_id_item":' + idi + ',"Cause":"' + cause + '","Status_id":' + stat + ',"UserHash":"' + SessionInfo1.UserHash + '","Time":"' + time1 + '"}' );

}
function getOrderStatus( idd, idi, stat ) {  //получить конкретный статус
    var id = idd.split( '-' );
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructIDOrdIDitIDStat",' +
        '"Values":[' + id[0] + ',' + idi + ',' + stat + '],"Limit":0,"Offset":0,"ID_msg":"statgs"}' );
}

function getOrderStatusFirst( idd ) {
//----Читаем
    var id = idd.split( '-' );
    //ws.send('{"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructIDOrdIDitIDStat","Values":['+id+','+idi+','+stat+'],"Limit":0,"Offset":0,"ID_msg":"statgs"}');
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"Value","Values":[' + id[0] + ',1],"Limit":0,"Offset":0,"ID_msg":"statgs"}' );
}

function addFirstStatusToArray( data ) {
    var data1 = JSON.parse( data );
    //console.log(data1);
    if ( data1.Order_id == 0 ) return;
    for ( var i = 1; i <= OrderL.count; i++ )
        if ( data1.Order_id == OrderL[i].Order_id ) {
            OrderL[i].Cause_First = data1.Cause;
            OrderL[i].Status_id_First = data1.Status_id;
            OrderL[i].UserHashStatus_First = data1.UserHash;
            OrderL[i].TimeStatus_First = data1.Time;
        }
}

function updOrderStatusActive( id, idi ) {
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructIDOrdIDit",' +
        '"Values":[' + id + ',' + idi + '],"Limit":0,"Offset":0,"ID_msg":"updactstat"}' );
}

function updActiveStatus( data ) {
    var data1 = JSON.parse( data );
    console.log( "Получен активный статус " + data1.Status_id + "Активный статус " + activeOrder.Status_id );
    if ( (data1.Status_id == 15 || data1.Status_id == 16) && !(activeOrder.Status_id == 15 || activeOrder.Status_id == 16) ) {
        // TODO showModalDialog();
        $( "#confirmCancel" ).modal( 'show' );
    }
}
function cancelStatusActive( stat ) {
    var id = activeOrder.Order_id,
        idi = activeOrder.ID_item;
    console.log( "cancelorderstatus" + ' ' + id + ' ' + idi + ' ' + stat );
    var time1 = getTimeOnNow();
    ws.send( '{"Table":"OrderStatus","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0,"ID_msg":"cancelstat"}' +
        '{"Order_id":' + id + ',"Order_id_item":' + idi + ',"Cause":"","Status_id":' + stat + ',"UserHash":"' + SessionInfo1.UserHash + '","Time":"' + time1 + '"}' );

    makeFinished( id, idi );//TODO а надо ли?

}

function getOrderStatusActive( idd ) {
    var id = idd.split( '-' );
    ws.send( '{"Table":"OrderStatus","Query":"Read","TypeParameter":"ValueStructIDOrdIDit",' +
        '"Values":[' + id[0] + ',' + id[1] + '],"Limit":0,"Offset":0,"ID_msg":"getactstat"}' );
}


function addActiveStatus( data ) {
    var data1 = JSON.parse( data );
    //console.log(data1);
    activeOrder.Cause_Last = data1.Cause;
    activeOrder.Status_id_Last = data1.Status_id;
    activeOrder.UserHashStatus_Last = data1.UserHash;
    activeOrder.TimeStatus_Last = data1.Time;
}

function makeFinished( id, idi ) {
    //----Сделать заказ прготовленым
    ws.send( '{"Table":"OrderList","Query":"Update","TypeParameter":"Finished",' +
        '"Values":[' + id + ',' + idi + ',true],"Limit":0,"Offset":0,"ID_msg":"makefinished"}' );
}

//--------------------------------------------PERSONAL----------------------

function addPersonalToArray( data ) {

}

function sendPersonal( id, idi ) { //add personal

    console.log( "neworderpersonal" + id + ' ' + idi );
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

//запрос времени сервера
function getSystemTime() {
    ws.send( '{"Table":"LocalTime","ID_msg":"localtime"}' );
}

//вычисление поправки времени относительно сервера 00:00:00
function SETSYSTIME( time ) {
    SYSTIME = timeMinus( getTimeNow1( 0 ), time, 0 );
    warning( SYSTIME, 'i', 5000 );
}

///-------------------------------------------TIMERS
//----Создаем
function createTimer( id, idi ) {
    ws.send( '{"Table":"TimersCook","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0,"ID_msg":"cretimer"}{"Order_id":' + id + ',"Order_id_item":' + idi + '}' );
    //ws.send('{"Table":"TimersCook","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0}{"Order_id":26,"Order_id_item":1}');
}

//
//
// ----Обновляем
function finishTimer( id, idi ) {
    var time_end = getTimeOnNow();
    ws.send( '{"Table":"TimersCook","Query":"Update","TypeParameter":"Cause","Values":[' + id + ',' + idi + ',' + time_end + '],"Limit":0,"Offset":0,"ID_msg":"fintimer"}' );
}
//
//
// ----Читаем элемент
function getTimer( idd ) {
    var id = idd.split( '-' );
    ws.send( '{"Table":"TimersCook","Query":"Read","TypeParameter":"Value","Values":[' + id[0] + ',' + id[1] + '],"Limit":0,"Offset":0,"ID_msg":"gettimer"}' );
    // ws.send('{"Table":"TimersCook","Query":"Read","TypeParameter":"Value","Values":[26,1],"Limit":0,"Offset":0,"ID_msg":"gettimer"}');
}
//

function addTimer( data ) {
    // {"Order_id":2,
    // "Order_id_item":1,
    // "Time_begin":"2017-05-02T10:03:47.164989Z",
    // "Time_end":"0001-01-01T00:00:00Z",
    // "Count":1,
    // "Finished":false}
    console.log( "TIMER" + data );
    var data1 = JSON.parse( data );
    for ( var i = 1; i <= OrderL.count; i++ )
        if ( data1.Order_id == OrderL[i].Order_id && data1.Order_id_item == OrderL[i].ID_item ) {
            OrderL[i].Time_begin = data1.Time_begin;
            OrderL[i].Time_end = data1.Time_end;
            OrderL[i].Time_Finished = data1.Finished;

        }
    //   console.log("TIMEEEE"+data1.Time_begin);
    $( '#a_timer' + data1.Order_id + '-' + data1.Order_id_item ).ready( function () {
        $( '#a_timer' + data1.Order_id + '-' + data1.Order_id_item ).attr( "data-timer-stat", data1.Time_begin );
    } );
    //$("p[id*='a_timer"+data1.Order_id+"']") ;
}
//-------------------------------------------ОТОБРАЖЕНИЕ
var redone = '', apply = 1, timerr = '';

function addOrderToTable( arrOrder ) {
    var strOrderHTML = '', late = '';
    timerr = '';
    var linkOrder = '';//(late!=''||redone!='')?'href="/order/' + arrOrder.Order_id + '/'+arrOrder.ID_item + '"':'';
    var pricename = "", sizename = "";
    if ( tracker == 2 ) {
        var testo, teston, size, sizen, sizeprice = "";
        teston = arrOrder.PriceName.indexOf( '(' );
        sizen = arrOrder.PriceName.indexOf( ',' );
        pricename += arrOrder.PriceName.slice( 0, sizen );
        if ( sizen > 0 ) sizename += arrOrder.PriceName.slice( sizen + 1, sizen + 3 );
        if ( teston > 0 ) sizename += arrOrder.PriceName.slice( teston, teston + 3 );
    }
    else pricename = textVal( arrOrder.PriceName );
    sizeprice = (tracker == 2 || tracker == 3) ? ('<p class="font_main_name_small">' + textVal( pricename ) + '</p><p class="font_main_name_big">' + textVal( sizename ) + '</p>') :
        ('<p class="font_main_name">' + textVal( pricename ) + '</p>');

    var strOrderHTML = "";
    strOrderHTML += '' +
        '<a ' + linkOrder + ' class="col-xs-12 col-sm-4 styleDiv ' + late + ' ' + redone + '" name="' + arrOrder.CookingTracker + '" ' +
        'id="a' + arrOrder.Order_id + '-' + arrOrder.ID_item + '">' +
        <!-- Сюда передаем время когда получили заказ -->
        '<input id="a_time_status' + arrOrder.Order_id + '-' + arrOrder.ID_item + '" class="startTimeOrder" hidden value="' + timeVal( arrOrder.TimeStatus_First ) + '">' +
        '<p class="font_main_check">#' + arrOrder.Order_id + '-' + arrOrder.ID_item + '' + ((arrOrder.ID_parent_item) ? '(Сет ' + arrOrder.ID_parent_item + ')' : '') + '</p>' +
        sizeprice +//'<p class="font_main_name">' + textVal(arrOrder.PriceName) +  '</p>'+
        '<p id="a_timer' + arrOrder.Order_id + '-' + arrOrder.ID_item + '" class="font_main_time" data-timer-stat="' + timeVal( arrOrder.Time_begin ) + '" data-role="timer">' + '00:00:00' +//timeMinus(getTime1(),sliceTime(timeVal(arrOrder.TimeStatus_First)),1) +
        '</p>' + timerr +
        '<!-- Сюда передаем норму времени -->' +
        '<input hidden value="00:30:00">' +
        '<input class="priceid" hidden value="' + arrOrder.Price_id + '">' +
        '</a>';

    $( document ).ready( function () {
        if ( $( '#a' + arrOrder.Order_id + '-' + arrOrder.ID_item ).length == 0 ) { //если нет такого элемента добавляем, иначе заменяем новым
            $( '.order_table' ).append( strOrderHTML );
        }
        else {
            $( '#a' + arrOrder.Order_id + '-' + arrOrder.ID_item ).replaceWith( strOrderHTML );
        }
    } );
}

function addOrderToTable1() {
    // $(".order_table").empty();
    //soundClick();
    for ( var i = 1; i <= OrderL.count; i++ ) {
        addOrderToTable( OrderL[i] );
    }
    $( document ).ready( function () {
        startTimer();
        // downTimer1();
    } );
}

//копирование информации заказа в активный заказ при клике
$( '.order_table' ).on( 'click', '.col-sm-4.styleDiv', function () {

    $( ".order_table" ).hide();
    $( ".order_item" ).show();
    var number = ($( this ).find( ".font_main_check" ).html()),
        text = ($( this ).find( ".font_main_name" ).html());
    if ( !text ) text = ($( this ).find( ".font_main_name_small" ).html()) + ' ' + ($( this ).find( ".font_main_name_big" ).html());
    var time = ($( this ).find( ".font_main_time" ).html()),
        starttime = $( this ).find( ".startTimeOrder" ).attr( 'value' ),
        id = number.slice( 1, number.indexOf( '-' ) ),
        idi = number.slice( number.indexOf( '-' ) + 1 );
    console.log( idi );
    if ( idi.indexOf( '(' ) > 0 ) idi = idi.slice( 0, idi.indexOf( '(' ) );
    console.log( idi );
    $( "#in_work" ).attr( "data-timer-stat", $( this ).find( ".font_main_time" ).attr( "data-timer-stat" ) );
    console.log( $( this ).find( ".font_main_time" ).attr( "data-timer-stat" ) );
    getOrderActive( id, idi );

    //OrderL[0].Price_id
    // TODO загрузить по activeOrder подробную информацию о продукте и рецепт, таймер запустить

    $( "#check" ).html( number );
    $( "#name" ).html( text );
    $( "#time" ).html( time );


    var cooktr = $( this ).attr( "name" );// что это?
    $( "#check" ).parent().find( ".startTimeOrder" ).attr( 'value', starttime );
    var priceid = $( this ).find( ".priceid" ).attr( 'value' );//activeOrder.Price_id;
    sendPersonal( id, idi );
    if ( cooktr == tracker ) {
        sendStatus1( id, idi, 4 );
        console.log( $( this ).find( ".font_main_time" ).attr( "data-timer-stat" ) == "0001-01-01T00:00:00Z" );
        if ( $( this ).find( ".font_main_time" ).attr( "data-timer-stat" ) == "0001-01-01T00:00:00Z" )
            createTimer( id, idi );
    }
    timer_int = setInterval( function () {
        downTimer()
    }, 1000 );
    // else {  }
} );

function textVal( text ) {
    if ( text == "Undefined" || text == "undefined" || !text ) return " ";
    return text;
};

function timeVal( text ) {
    if ( text == "Undefined" || text == "undefined" || !text ) return "0001-01-01T00:00:00Z";
    return text;
};

function intVal( text ) {
    if ( text == "Undefined" || text == "undefined" || !text ) return "0";
    return text;
};


$( '.button_ok' ).click( function () {
    //if (1){warning("Невозможно так быстро приготовить продукт",'a', 5000);return;} time_second2 (activeOrder.TimeCook)
    if ( timeMinus( time_second2( activeOrder.TimeCook ), $( "#in_work" ).text() ) < minimal_cook_time ) {
        warning( "Невозможно так быстро приготовить продукт", 'a', 5000 );
        console.log( timeMinus( time_second2( activeOrder.TimeCook ), $( "#in_work" ).text() ) );
        return;
    }
    $( ".order_table" ).show();
    $( ".order_item" ).hide();
    var id = activeOrder.Order_id, idi = activeOrder.ID_item;

    if ( tracker == 1 ) {
        makeFinished( id, idi );
        sendStatus2( id, idi, 8 );
    }
    if ( tracker == 2 ) sendStatus2( id, idi, 6 ); //если была "Раскатка"
    if ( tracker == 3 ) sendStatus2( id, idi, 7 );    //если была  "Начинение"
    if ( tracker == 4 ) {
        makeFinished( id, idi );
        sendStatus2( id, idi, 8 );
    }  //если была  "Запекание"
    activeOrder = {};
    clearInterval( timer_int );
    getOrderL();
} );

$( '.button_cancel' ).click( function () {
    $( ".order_table" ).show();
    $( ".order_item" ).hide();
    var id = activeOrder.Order_id, idi = activeOrder.ID_item;
    if ( tracker == activeOrder.CookingTracker )
        sendStatus2( id, idi, 3 );
    activeOrder = {};
    getOrderL();
} );

//изменение трекера в зависимости от селекта
$( ".dropdown-toggle.user_role" ).change( function () {
    tracker = $( ".dropdown-toggle.user_role option:selected" ).index() + 1;
    $.cookie( 'tracker', tracker );
    getOrderL();
} );

function redoneActive( n1, n3 ) {
    //if (n==1)     //без списание
    //if (n2==1)    // в трекер
    var id = activeOrder.Order_id, idi = activeOrder.ID_item;
    sendStatus3( id, idi, 14, n3 );//переделка
    if ( tracker < 3 ) {
        if ( n1 == 0 ) {
            sendStatus2( id, idi, 3 );
            sendStatus2( id, idi, 4 );
            $( "#in_work" ).html( time_second2( activeOrder.TimeCook ) );
        }
        else {
            sendStatus2( id, idi, 3 );
            $( '.button_cancel' ).click();
        }   //в трекер
    }
    else {
        sendStatus2( id, idi, 3 );
        $( '.button_cancel' ).click();
    }   //в трекер


}

function soundClick() {
    var audio = new Audio(); // Создаём новый элемент Audio
    audio.src = '../../public/cook/js/ring.mp3'; // Указываем путь к звуку "клика"
    audio.autoplay = true; // Автоматически запускаем

}

function getSessionHash() {
    //ws.send('{"Table":"Session","TypeParameter":"Read","ID_msg":"SessionHash"}');
    ws.send( '{"Table":"Session","TypeParameter":"ReadNotRights","ID_msg":"SessionHash"}' );
}

function setSessionInfo( data ) {
    //console.log(data);
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
    if ( role_test_debug ) SessionInfo1.RoleHash = test_role_hash;    //debug
    ws.send( '{"Table":"Tabel","Values":["' + SessionInfo1.UserHash + '"],"ID_msg":"SessionTabel"}' );
    setupSessionInfo();
    getOrderL();
}


function setSessionTabel( data ) {
    var data1 = JSON.parse( data );
    user_stat.PlanTime = data1.PlanTime;
    user_stat.JobTime = data1.JobTime;
}


/// заполнение полей повара
function setupSessionInfo() {
    // $(document).ready(function () {
    $( "#name_role" ).html( SessionInfo1.RoleName );
    $( "#name_role1" ).html( SessionInfo1.RoleName );
    $( "#fio" ).html( SessionInfo1.SurName + ' ' + SessionInfo1.FirstName );
    $( "#fio1" ).html( SessionInfo1.SurName + ' ' + SessionInfo1.FirstName );
    $( "#horse_m" ).html( user_stat.WorkHours );
    $( "#prod_count" ).html( user_stat.MakeToday );//MakeToday: 6,               //Сегодня изделий: 63
    $( "#prod_m" ).html( user_stat.MakeMounth );//    MakeMounth: 1999,           //Изделия с нач.мес.: 2101
    //$("#time_acceptance_order").html(user_stat.TimeGetMedium);
    $( "#rating" ).html( user_stat.Rating );
    $( "#award" ).html( user_stat.BalansMinus );
    $( "#balance" ).html( user_stat.Balans );
    if ( SessionInfo1.RoleHash == sushist ) {
        if ( $.cookie( 'tracker' ) != 1 ) {
            $.cookie( 'tracker', 1 );
            tracker = 1;
        }
        $( ".dropdown-toggle.user_role" ).hide();
    }
    if ( SessionInfo1.RoleHash == pizza ) {
        if ( $.cookie( 'tracker' ) == 1 ) {
            $.cookie( 'tracker', 2 );
            tracker = 2;
        }
    }
}
//setupSessionInfo();


$( "#logout" ).click( function () {
    //закрыть сессию
    //перейти на yapoki
    ws.send( '{"Table":"Session","TypeParameter":"Abort","ID_msg":"SessionHash"}' );
    $.removeCookie( "hash", { domain: 'yapoki.net', path: "/" } );
    $.removeCookie( "mysession", { domain: 'yapoki.net', path: "/" } );
    document.location.href = auth_page;
} );

var ordd1 = {
    "Order_id": 60,
    "ID_item": 1,
    "ID_parent_item": 0,
    "Price_id": 92,
    "PriceName": "Маргарита,25(t)",
    "Type_id": 5,
    "TypeName": "Суши",
    "Parent_id": 7,
    "ParentName": "Суши и роллы",
    "Image": "http://prod.yapoki.net/img/435_346_krabspaysi.png",
    "Units": "гр.",
    "Value": 0,
    "Set": false,
    "Finished": false,
    "DiscountName": "",
    "DiscountPercent": 0,
    "Price": 69,
    "CookingTracker": 1,
    "TimeCook": 100,
    "TimeFry": 0,
    "Composition": "",
    "Additionally": "",
    "Packaging": ""
};


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

$( document ).on( 'click', "#sound", function () {
    new Audio( '../../public/cook/js/ring.mp3' ).play();
} );