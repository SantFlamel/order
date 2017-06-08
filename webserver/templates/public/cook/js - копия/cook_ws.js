//////--------| WEBSOCKET |----------------------------------------------------------
var ws
    , AUTH = { "HashAuth": SESSION_HASH }
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
        // console.info( 'ws.onmessage', msg );
        var type = msg.data.slice( 0, 2 ), data = msg.data
            , IDMsg = msg.data.split( '{' )[0].split( ':' )[1];
        data = data.slice( data.indexOf( '{' ) + 1 );
        MSG._in( IDMsg, data, type );
    };
    ws.onopen = function () {
        war.con1 = warning( 'Подключено.', 'info', ALERT_TIME, [war.con, war.err, war.clo] );
        console.info( 'WS OPEN', new Date().toJSON(), WS_URL );
        MSG.send( { structure: AUTH } ); // авторизация // в начале файла
        MSG.request.sessionInfo();
        // while ( MSG.wait.length > 0 ) {
        //     console.info( 'WS SEND WAIT' );
        //     (MSG.wait.pop())();
        // }
        Page.update();
        // ws.send('EndConn');
    };
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
webSocket();
//--------------\ WEBSOCKET |----------------------------------------------------------

////////--------| MSG |----------------------------------------------------------
var getIDMsg = counter( 10000 );
MSG = {
    get: {}, request: {}, close: {}, set: {}, exceptionOrder: [], wait: [] // отложенные отправки
    , handlersList: {} // storage handlers
    , multipleHandlers: {} // storage multiple handlers
    , EOFHandlersList: {}, check: {}
    , notGet: {}, notGetEOF: {}
    , _in: function ( IDMsg, data, type ) { // input MSG
        // if ( MSG.notGet[IDMsg] ) {
        //     clearTimeout( MSG.notGet[IDMsg] );
        //     delete MSG.notGet[IDMsg]
        // } else if ( MSG.notGetEOF[IDMsg] ) {
        //     clearTimeout( MSG.notGetEOF[IDMsg] );
        //     delete MSG.notGetEOF[IDMsg];
        // }
        if ( type === '00' ) { // ошибка
            if ( ~data.indexOf( 'sql: no rows in result set' ) ) {
                if ( ~data.indexOf( 'OrderStatus ERROR Read, TYPE PARAMETERS "ValueStructIDOrdIDit" VALUES: ' ) ) {
                    var x = data.split( '[' )[1].split( ']' )[0].split( ' ' );
                    if ( x[1] == 0 && Order.list.hasOwnProperty( x[0] ) ) {
                        delete Order.list[x[0]];
                    }
                }
                console.groupCollapsed( '%cMSG NO RESULT::><><%c' + IDMsg + ' %c-No result', 'color: red', 'color: #444100', 'color: #019500' );
                console.warn( data );
            } else if ( IDMsg == 'Auth' || ~data.indexOf( 'NO CHECKED' ) ) { // ошибка авторизации
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
        } else if ( data === 'EOF' ) { // конец передаци.
            // удаляем обработчик, после прерываем функцию
            if ( MSG.EOFHandlersList.hasOwnProperty( IDMsg ) ) {
                MSG.EOFHandlersList[IDMsg]();
                delete MSG.EOFHandlersList[IDMsg];
            }
            if ( MSG.multipleHandlers.hasOwnProperty( IDMsg ) ) {
                delete MSG.multipleHandlers[IDMsg];
            }
            console.info( '%cEND:::::: ' + IDMsg, 'color: #444100' );
            return;
        } else if ( type === '02' ) { // обновление данных
            console.group( '%cMSG UPDATE::::::%c' + IDMsg, 'color: #043700', 'color: #444100', Page.time() );
            console.info( data );
            MSG.update( JSON.parse( data ) );
            console.groupEnd();
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
            if ( !~data.indexOf( 'NO ERRORS Create, TYPE PARAMETERS: ""' ) ) {
                console.warn( data );
            }
        }
        if ( MSG.handlersList[IDMsg] ) {
            MSG.handlersList[IDMsg]( data, IDMsg );
            delete MSG.handlersList[IDMsg];
        } else if ( MSG.multipleHandlers[IDMsg] ) {
            MSG.multipleHandlers[IDMsg]( data, IDMsg );
        }
        console.groupEnd();
    }, send: function ( option ) { // send MSG
        // console.trace( 'option' ,option );

        // { structure: '', handler: '', mHandlers: '', EOFHandler: '', check: '' };

        // console.info( 'WS WAIT' );
        // if ( !~MSG.wait.indexOf( struct ) ) {
        //     MSG.wait.push( function () {
        //         ws.send( struct );
        //     } );
        // }
        var IDMsg = 'x' + getIDMsg(), struct = '', table;

        // if ( option.mHandlers ) {
        //     MSG.notGetEOF[IDMsg] = setTimeout( function () {
        //         warning( 'Не полученны данные:' + IDMsg );
        //     }, 5000 );
        // } else {
        //     MSG.notGet[IDMsg] = setTimeout( function () {
        //         warning( 'Не полученны данные:' + IDMsg );
        //     }, 5000 );
        // }

        try {
            checkUndefined( option.structure );  // TEST LINE(S) ////////////////////////
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
    }
};
//--------------\ MSG |----------------------------------------------------------
MSG.updaateTimeOut = { de: 0 };
MSG.update = function ( data ) {
    console.group( 'MSG.update' );
    var ID = data.Values[0];
    if ( data.ID_msg !== Cashier.OrganizationHash && data.ID_msg !== '' ) { // фильтр по организации
        console.groupEnd();
        return;
    }
    console.log( 'data.Table', data.Table );
    switch ( data.Table ) {
        case "Order":
            MSG.requestOrder( ID );
            warningAudio();
            break;
        case "OrderCustomer":
            if ( Order.list.hasOwnProperty( ID ) ) {
                MSG.requestCustomer( ID );
            } else {
                MSG.requestOrder( ID );
            }
            break;
        // case "OrderList":
        //     if ( Order.list.hasOwnProperty( ID ) ) {
        //         if ( $( '#description_order:visible' ).length !== 0 && document.title.split( '#' )[0] == ID ) {
        //             if ( MSG.updaateTimeOut.de === 0 ) {
        //                 MSG.updaateTimeOut.de = setTimeout( function () {
        //                     MSG.updaateTimeOut.de = 0;
        //                     MSG.requestOrder( ID );
        //                     Page.update()
        //                 }, 500 )
        //             }
        //         } else {
        //             MSG.requestOrderLists( ID );
        //         }
        //     } else {
        //         // MSG.requestOrder( ID );
        //     }
        //     break;
        case "Cashbox":
            console.group( 'Cashbox', data.Values[1] );
            if ( Order.list[data.Values[1]] ) {
                MSG.request.payment( data.Values[1] );
            } else {
            }
            console.groupEnd();
            break;
        case "OrderPersonal":
            break;
        case "OrderStatus":
            // console.log( "OrderStatus" );
            if ( Order.list[ID] ) {
                Order.list[ID].addStatus( { Order_id_item: data.Values[1], Status_id: data.Values[2] } );
                console.log( 'data.Values[1], data.Values[2]', data.Values[1], data.Values[2] );
            }
            break;
    }
    console.groupEnd();
};

////////--------| User_info |----------------------------------------------------------
MSG.close.session = function () {
    try {
        MSG.send( { structure: { "Table": "Session", "TypeParameter": "Abort" } } );
    } catch ( e ) {

    }
    alert( 'УДАЛЕНЫ КУКИ' );
    cookie.delete( 'hash', { domain: '.yapoki.net', path: '/' } );
    cookie.delete( 'mysession', { domain: '.yapoki.net', path: '/' } );
    ws.stop();
    // document.location.href = AUTH_URL;
};
MSG.request.sessionInfo = function () {
    MSG.send( {
        structure: { "Table": "Session", "TypeParameter": "ReadNotRights" }
        , handler: function ( data ) {
            CashierGet( data );
            MSG.request.tabel();
            CashBox.getSumInCashbox();
        }
    } );
};
MSG.request.tabel = function () {
    MSG.send( { structure: { "Table": "Tabel", "Values": [Cashier.UserHash] }, handler: MSG.get.tabel } );
};
////////--------| ORDER |----------------------------------------------------------
MSG.request.Order = function ( ID ) {
    var s = {
        "Table": "Order", "Query": "Read", "TypeParameter": "Value", "Values": [ID], "Limit": 0, "Offset": 0
    };
    MSG.send( {
        structure: s, handler: function ( data ) {
            MSG.get.Order( data );
        }
    } );
};
MSG.get.Order = function ( data ) {
    MSG.requestOrderStatus( data.ID );
    new Order( data );
};
//--------------\ ORDER |----------------------------------------------------------

////////--------| ORDER_LIST |----------------------------------------------------------
MSG.requestOrderLists = function ( ID ) {
    var s = {
        "Table": "OrderList", "Query": "Read", "TypeParameter": "RangeOrderID", "Values": [ID]
        , "Limit": 0, "Offset": 0
    };
    MSG.send( {
        structure: s, handler: MSG.get.OrderList, mHandlers: true, EOFHandler: function () {
            Order.list[ID].showDescription();
        }
    } );
};
MSG.get.OrderList = function ( data ) {
    if (document.querySelector('')){

    }
};
//--------------\ ORDER_LIST |----------------------------------------------------------


