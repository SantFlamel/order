/***
 * при подключении webSocket выполняется авторизация,
 * делается запрос информации о сессии, в качестве обработчика передаётся
 * функция setupSessionInfo куда передаются полученные данные.

 ** Типы:
 * 00 - ошибка,
 * 01 - обычные данные,
 * 02 - обновление: запускается MSG.update с распарсенными данными.

 * MSG.send - привячзка обработчиков и отправка данных. Принимает:
 *--| { structure: '', handler: '', mHandlers: '', EOFHandler: '', check: '', errorHandler: '' }
 *--| structure - запрос,
 *--| handler - обработчик результатов запроса,
 *--| mHandlers - флаг - если в ответ ожидается не одино сообщение,
 *--| EOFHandler - обработчик по оканчанию передачи,
 *--| check - флаг - если не прийдёт подтверждение то будет выведена ошибка,
 *--| errorHandler - при ошибке будет запускаться данныый обработчик
 **** **
 *
 * MSG._in - первичная обработка данных
 *--| в обработчик возвращает обект данных, при создании идентификатор, при ошибке текст.

 * MSG.request - запросы данных
 * MSG.get - обрботка полученных данных
 * MSG.set - зоздание, изменение
 * MSG.close - завершение чего-либо

 * ***/

function counter( val ) {
    var count = val || -1;
    return function () {
        return ++count;
    };
}
////////--------| WARNINGS_MESSAGE |----------------------------------------------------------
/** txt - выводимый текст
 * , alert - тип(null, 'info', 'alert' - разные по цветам)
 * , time - время на которое показывается
 * , except - id сообщения которое нужно удалить при появлении создаваемого
 * , impot - флаг - зафиксировать сообщение

 * возвращает id сообщения.
 * **/
var countWarning = counter();
function warning( txt, alert, time, except, impot ) {
    var i, cl = '', id = 'warning-' + countWarning(), id_elem = 'id="' + id + '"'
        , dublicate = $( 'button:contains(' + txt + ')' )
        , disabled = '';
    if ( alert ) {
        cl = 'class="' + alert + '"';
    }
    if ( except ) {
        if ( Array.isArray( except ) ) {
            for ( i in except ) {
                $( '#' + except[i] ).remove();
            }
        } else {
            $( '#' + except ).remove();
        }
    }
    if ( time ) {
        setTimeout( function () {
            $( '#' + id ).remove();
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
$( document ).on( 'click', '#warning button', function () {
    $( this ).remove();
} );
//--------------\ WARNINGS_MESSAGE |----------------------------------------------------------

//////--------| WEBSOCKET |----------------------------------------------------------
var ws
    , STOP_WS = false
    ;
function webSocket() {
    if ( STOP_WS ) {
        return;
    }
    ws = new WebSocket( WS_URL );
    war.con = warning( 'Подключение...', 'info', null, [war.clo, war.con1] );
    ws.onerror = function ( e ) {
        war.err = warning( 'Ошибка подключения.', null, null, [war.con, war.con1] );
        console.error( 'WS ERROR::', e );
    };
    ws.onclose = function () {
        war.clo = warning( "Подключение закрыто.", null, null, [war.con, war.con1] );
        console.info( '%cWS CLOSE', 'color: #370300' );
        setTimeout( webSocket, WS_TIMEOUT );
    };
    ws.onmessage = function ( msg ) {
       //  console.info( 'ws.onmessage', msg );
        var type = msg.data.slice( 0, 2 ), data = msg.data
            , IDMsg = msg.data.split( '{' )[0].split( ':' )[1];
        MSG._in( IDMsg, data.slice( data.indexOf( '{' ) + 1 ), type );
    };
    ws.onopen = function () {
        war.con1 = warning( 'Подключено.', 'info', ALERT_TIME, [war.con, war.err, war.clo] );
        console.info( 'WS OPEN', new Date(), WS_URL );
        MSG.send( { structure: { "HashAuth": SESSION_HASH } } ); // авторизация // в начале файла
        MSG.request.sessionInfo();

        //Для повара
        MSG.request.SystemTime();
    };

    // зкарываем подключение через сокеты
    ws.stop = function ( time ) {
        STOP_WS = true;
        if ( time ) {
            setTimeout( function () {
                STOP_WS = false;
                webSocket();
            }, time )
        }
        try {
            ws.send( 'EndConn' );
        } catch ( e ) {
        }
    }
}
//--------------\ WEBSOCKET |----------------------------------------------------------

////////--------| MSG |----------------------------------------------------------
var getIDMsg = counter( 10000 );
MSG = {
    get: {}, request: {}, close: {}, set: {}
    , handlersList: {} // storage handlers
    , errorHandlerList: {} // storage handlers
    , multipleHandlers: {} // storage multiple handlers
    , EOFHandlersList: {}, check: {}
    , _in: function ( IDMsg, data, type ) { // input MSG
        if ( type === '02' ) { // обновление данных
            console.group( '%cMSG UPDATE::::::%c' + IDMsg, 'color: #043700', 'color: #444100', 0 );
            console.info( data );
            MSG.update( JSON.parse( data ) );
            console.groupEnd();
            return;
        } else if ( data === 'EOF' ) { // конец передаци.
            // удаляем обработчик, после прерываем функцию
            if ( MSG.EOFHandlersList[IDMsg] ) {
                MSG.EOFHandlersList[IDMsg]();
                delete MSG.EOFHandlersList[IDMsg];
            }
            delete MSG.multipleHandlers[IDMsg];
            delete MSG.errorHandlerList[IDMsg];
            console.info( '%cEND:::::: ' + IDMsg, 'color: #444100' );
            return;
        } else if ( type === '00' ) { // ошибка
            // если есть то выполняем его
            if (MSG.errorHandlerList[IDMsg]){
                MSG.errorHandlerList[IDMsg](data);
                if ( !MSG.multipleHandlers[IDMsg] ) {
                    // если ответ доолжен бытьтолько один то удаляем обработчики
                    delete MSG.errorHandlerList[IDMsg];
                    delete MSG.handlersList[IDMsg];
                }
                return;
            }
            if ( ~data.indexOf( 'sql: no rows in result set' ) ) {
                if ( ~data.indexOf( 'OrderStatus ERROR Read, TYPE PARAMETERS "ValueStructIDOrdIDit" VALUES: ' ) ) {
                    var x = data.split( '[' )[1].split( ']' )[0].split( ' ' );
                    if ( x[1] == 0 && Order.list.hasOwnProperty( x[0] ) ) {
                        delete Order.list[x[0]];
                    }
                }
                console.groupCollapsed( '%cMSG NO RESULT::><><%c' + IDMsg + ' %c-No result', 'color: red', 'color: #444100', 'color: #019500' );
                console.warn( data );
            }  else if ( IDMsg == 'Auth' || ~data.indexOf( 'NO CHECKED' ) ) { // ошибка авторизации
                console.group( '%cMSG NO CHECKED::><><', 'color: red' );
                console.error( data );
                MSG.close.session();
            } else if ( ~data.indexOf( 'duplicate key value violates unique constraint' ) ) {
                console.groupCollapsed( '%cMSG DUPLICATE::><><%c' + IDMsg, 'color: red', 'color: #444100' );
                console.warn( data );
                clearTimeout( MSG.check[IDMsg] );
            } else {
                console.group( '%cMSG ERROR::><><%c' + IDMsg, 'color: red', 'color: #017200' );
                console.error( data );
            }
            console.groupEnd();
            delete MSG.handlersList[IDMsg];
            delete MSG.multipleHandlers[IDMsg];
            return;
        }
        if ( MSG.check[IDMsg] ) { // удалям сообщение об ошибке
            if ( ~data.indexOf( 'NO ERRORS Create, TYPE PARAMETERS' ) || !isNaN( +data ) ) {
                clearTimeout( MSG.check[IDMsg] );
            }
            delete MSG.check[IDMsg];
        }
        console.group( '%cMSG IN::::<<<<%c' + IDMsg, 'color: green', 'color: #444100' );
        console.info( data );
        try { // пытаеммся распарсить
            data = JSON.parse( data );
        } catch ( e ) {
            if ( !~data.indexOf( 'NO ERRORS Create, TYPE PARAMETERS:' ) ) {
                console.warn( data );
            }
        }
        if ( MSG.handlersList[IDMsg] ) {
            MSG.handlersList[IDMsg]( data, IDMsg );
            delete MSG.handlersList[IDMsg];
            delete MSG.errorHandlerList[IDMsg];
        } else if ( MSG.multipleHandlers[IDMsg] ) {
            MSG.multipleHandlers[IDMsg]( data, IDMsg );
        }
        console.groupEnd();
    }, send: function ( option ) { // send MSG
        var IDMsg = 'x' + getIDMsg(), struct = '', table;

        try { // проверяет структуры на присутствие undefined
            checkUndefined( option.structure );
        } catch ( e ) {
        }
        if ( Array.isArray( option.structure ) ) {
            option.structure[0]["ID_msg"] = IDMsg;
            table = option.structure[0]["Table"] + ' ' + (option.structure[0]["Query"] || '');
            for ( var i in option.structure ) {
                struct += JSON.stringify( option.structure[i] );
            }
        } else {
            option.structure["ID_msg"] = IDMsg;
            table = option.structure["Table"] + ' ' + (option.structure["Query"] || '' );
            struct = JSON.stringify( option.structure );
        }
        if ( option.check ) {
            MSG.check[IDMsg] = setTimeout( function () {
                ws.send( struct );
                setTimeout( function () {
                    warning( 'Внимание!!! Данные не отправились!' )
                }, WS_ERROR_TIMEOUT );
            }, WS_ERROR_TIMEOUT );
        }
        if ( option.EOFHandler ) {
            MSG.EOFHandlersList[IDMsg] = option.EOFHandler;
        }
        console.group( "%cMSG SEND::::>>>>%c" + IDMsg, 'color: blue', 'color: #444100', (table || '') );
        console.info( struct );
        try {
            ws.send( struct );
        } catch ( error ) {
            console.error( 'ОШИБКА', error.message );
        }
        console.groupEnd();
        if ( option.handler ) {
            if ( option.mHandlers ) {
                MSG.multipleHandlers[IDMsg] = option.handler;
            } else {
                MSG.handlersList[IDMsg] = option.handler;
            }
        }
        if (option.errorHandler){
            MSG.errorHandlerList[IDMsg] = option.errorHandler;
        }
    }
};
//--------------\ MSG |----------------------------------------------------------
MSG.updaateTimeOut = { de: 0 };

////////////////////////////SESSION
MSG.close.session = function () {
    console.trace("CLOSE");
    try {
        // MSG.send( { structure: { "Table": "Session", "TypeParameter": "Abort" } } );
    } catch ( e ) {
    }
    $.removeCookie( "hash", { domain: 'yapoki.net', path: "/" } );
    $.removeCookie( "mysession", { domain: 'yapoki.net', path: "/" } );
    ws.stop();
    // document.location.href = AUTH_URL;
};
MSG.request.tabel = function (userHash) { // функция не существует
    MSG.send( { structure: { "Table": "Tabel", "Values": [userHash] }, handler: MSG.get.tabel } );
};
MSG.request.sessionInfo = function () { // получение информации о сессии
    MSG.send( { structure: { "Table": "Session", "TypeParameter": "ReadNotRights" }, handler: setupSessionInfo } );
};
MSG.request.Order = function ( ID, func ) {
    var s = {
        "Table": "Order", "Query": "Read", "TypeParameter": "Value", "Values": [ID], "Limit": 0, "Offset": 0
    };
    MSG.send( {
        structure: s, handler:func } );
};
MSG.request.OrderLists = function ( ID, func, func1  ) {
    var s = {
        "Table": "OrderList", "Query": "Read", "TypeParameter": "RangeOrderID", "Values": [ID]
        , "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s, handler: func, mHandlers: true, EOFHandler: func1 } );
};
//установка статусов заказов
MSG.set.Status = function ( ID, id_item, stat ,cause) {
    MSG.send(
        {structure:
            [{"Table":"OrderStatus","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0},
                {"Order_id":  +ID  ,"Order_id_item":  +id_item  ,"Cause": cause || "" ,"Status_id": +stat ,"UserHash":SESSION_INFO.UserHash, "Time":getTimeOnNow() }] } );
};
//----Сделать заказ прготовленым
MSG.set.finished = function ( ID, id_item ) {
    MSG.send(
        {structure:
            [{"Table":"OrderList","Query":"Update","TypeParameter":"Finished","Values":[ID,id_item,true],"Limit":0,"Offset":0} ]} );
};

$( "#logout" ).click( MSG.close.session );

MSG.set.personal = function ( id, idi ) {
    MSG.send(
        {structure:
            [{"Table":"OrderPersonal","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0},
            {"Order_id":  +id  ,"Order_id_item":  +idi  ,"UserHash":SESSION_INFO.UserHash,
            "FirstName": SESSION_INFO.FirstName ,"SecondName":SESSION_INFO.SecondName ,"SurName": SESSION_INFO.SurName ,
            "RoleHash": SESSION_INFO.RoleHash ,"RoleName":SESSION_INFO.RoleName}] } );
};


//запрос времени сервера
MSG.request.SystemTime = function() {
    MSG.send( {structure: {"Table":"LocalTime","Limit":0,"Offset":0}, handler:MSG.get.setsystime } );
};