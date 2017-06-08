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
        MSG._in( IDMsg, data.slice( data.indexOf( '{' ) + 1 ), type );
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
//--------------\ User_info |----------------------------------------------------------

////////--------| ORDER |----------------------------------------------------------
MSG.requestOrder = function ( ID ) {
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
    if ( Order.list[data['Order_id']] ) {
        var order = Order.list[data['Order_id']];
        if ( !order.OrderList ) {
            order.OrderList = {}
        }
        if ( data.CookingTracker == 0 ) {
            data.status = 8;
            data.Finished = true;
        }
        order.OrderList[data['ID_item']] = data;
        MSG.requestOrderStatus( data['Order_id'], data['ID_item'] );
    }
};
//--------------\ ORDER_LIST |----------------------------------------------------------
////////--------| STATUS |----------------------------------------------------------
MSG.requestOrderStatus = function ( ID, ID_item ) {
    // console.group( 'requestOrderStatus', ID, ID_item );
    var s = {
        "Table": "OrderStatus", "Query": "Read", "TypeParameter": "ValueStructIDOrdIDit"
        , "Values": [ID, ID_item || 0], "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s, handler: MSG.get.Status } );
    // console.groupEnd();
};
MSG.setFinished = function ( ID, id_item, fin ) {
    var s = {
        "Table": "OrderList", "Query": "Update", "TypeParameter": "Finished"
        , "Values": [ID, id_item, fin], "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s } )
};
MSG.get.Status = function ( data ) {
    if ( data.Order_id !== 0 || Order.list[data.Order_id] ) {
        Order.list[data.Order_id].addStatus( data )
    }
};

MSG.setStatus = function ( Order_id, Order_id_item, Status_id ) {
    var status = [{
        "Table": "OrderStatus", "Query": "Create", "TypeParameter": "", "Values": null, "Limit": 0, "Offset": 0
    }, {
        "Order_id": +Order_id, "Order_id_item": +Order_id_item, "Cause": "", "Status_id": +Status_id,
        "UserHash": Cashier.UserHash, "Time": Page.time()
    }];
    MSG.send( { structure: status, check: true } );
};
Order.status = {
    1: { "ID": 1, "Name": "Предзаказ" }
    , 2: { "ID": 2, "Name": "Принят" }
    , 3: { "ID": 3, "Name": "Передан" }
    , 4: { "ID": 4, "Name": "В работе" }
    , 5: { "ID": 5, "Name": "Раскатка" }
    , 6: { "ID": 6, "Name": "Начинение" }
    , 7: { "ID": 7, "Name": "Запекание" }
    , 8: { "ID": 8, "Name": "Приготовлен" }
    , 9: { "ID": 9, "Name": "Собран" }
    , 10: { "ID": 10, "Name": "Доставлятся" }
    , 11: { "ID": 11, "Name": "Доставлен" }
    , 12: { "ID": 12, "Name": "На месте в ожидании" }
    , 13: { "ID": 13, "Name": "Заказ не забрали" }
    , 14: { "ID": 14, "Name": "На переделке" }
    , 15: { "ID": 15, "Name": "Отменен со списанием" }
    , 16: { "ID": 16, "Name": "Отменен без списания" }
    , 17: { "ID": 17, "Name": "Изменен" }
};

// Подсчёт времени готовки
MSG.request.allStatusOrder = function ( ID ) {
    var s = {
        "Table": "OrderStatus", "Query": "Read"
        , "TypeParameter": "RangeOrderID", "Values": [ID], "Limit": 999, "Offset": 0
    };
    MSG.send( { structure: s, handler: MSG.get.allStatusOrder, mHandlers: true, EOFHandler: MSG.get.timeCock } );
};
MSG.get.allStatusOrder = function ( data ) {
    if ( !MSG.get.hasOwnProperty( '_allStatusOrder' ) ) {
        MSG.get._allStatusOrder = []
    }
    MSG.get._allStatusOrder.push( data )
};
MSG.get.timeCock = function () {
    var i, ii, s = {}, len, t1, t2;
    for ( i in MSG.get._allStatusOrder ) {
        ii = MSG.get._allStatusOrder[i];
        if ( ii.Status_id == 4 || ii.Status_id == 8 ) {
            if ( !s.hasOwnProperty( ii.Order_id_item ) ) {
                s[ii.Order_id_item] = [];
            }
            s[ii.Order_id_item].push( ii );
        }
    }
    for ( i in s ) {
        ii = s[i];
        len = ii.length;
        if ( len < 1 ) {
            continue
        } else if ( len == 2 ) {
            t1 = new Date( ii[0].Time );
            t2 = new Date( ii[1].Time );
            Order.list[ii[0].Order_id].OrderList[ii[0].Order_id_item].cookTime = t1 - t2;
        }
    }
};
//--------------\ STATUS |----------------------------------------------------------


//////--------| CashBox |----------------------------------------------------------
MSG.payment = {
    1: "Наличные"
    , 2: "Банковская карта"
    , 3: "Яндекс деньги"
    , 4: "WebMoney"
    , 5: "Bitcoin"
};
MSG.set.cashBoxOperation = function ( operation ) {
    operation.UserHash = Cashier.UserHash;
    operation.OrgHash = Cashier.OrganizationHash;

    var s = [{ "Table": "Cashbox", "Query": "Create", "TypeParameter": "", "Values": null, "Limit": 0, "Offset": 0 }
        , operation];
    MSG.send( {
        structure: s, handler: function ( data ) {
            MSG.request.cashBoxOperation( +data );
        }, check: true
    } );
};
MSG.request.cashBoxOperationByDate = function ( date ) {
    date = date || Page.timeBeginDay();
    if ( Cashier.OrganizationHash ) {
        var s = {
            "Table": "Cashbox", "Query": "Read", "TypeParameter": "RangeUserAndOrdAndTime"
            , "Values": [Cashier.UserHash, Cashier.OrganizationHash, date, Page.time()]
            , "Limit": 999, "Offset": 0
        };
        MSG.send( { structure: s, handler: Operation, mHandlers: true } )
    } else {
        setTimeout( arguments.callee, 50 )
    }
};
MSG.request.cashBoxOperationByChangeEmployee = function ( ID ) {
    CashBox.reset();
    var s = {
        "Table": "Cashbox", "Query": "Read", "TypeParameter": "RangeChangeEmployeeID"
        , "Values": [ID], "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s, handler: Operation, mHandlers: true } )
};
MSG.request.cashBoxOperation = function ( ID ) {
    var s = {
        "Table": "Cashbox", "Query": "Read", "TypeParameter": "Value", "Values": [ID], "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s, handler: Operation, mHandlers: true } )
};
MSG.request.payment = function ( ID ) {
    var s = { "Table": "Cashbox", "Query": "Read", "TypeParameter": "RangeOrderID", "Values": [ID] };
    Order.list[ID].payments = [];
    MSG.send( { structure: s, handler: MSG.get.payment, mHandlers: true } )
};
MSG.get.payment = function ( data ) {
    if ( !Order.list[data.Order_id] ) {
        console.error( 'Нет заказа', data );
        return;
    }
    var order = Order.list[data.Order_id];
    order.payments.push( data );
    if ( document.title.split( '#' )[1] == data.Order_id ) {
        Order.list[data['Order_id']].calcPayment();
    }
};
MSG.request.paymentByDeliveryman = function ( type_payments, user_hash, time_operation_begin, time_operation_end ) {
    var s = {
        "Table": "Cashbox", "Query": "Read"
        , "TypeParameter": "ValueNumberCountPriceWithDiscount"
        , "Values": [user_hash
            , Cashier.OrganizationHash, type_payments, time_operation_begin, time_operation_end]
        , "Limit": 0, "Offset": 0
    };
    MSG.send( {
        structure: s, handler: function () { // самоисполляющаяся
            return function ( data ) {
                Deliveryman.list[user_hash].addPay( type_payments, +data );
            }
        }(), mHandlers: true
    } );
};
MSG.request.rePrintCheck = function ( order_id ) {
    MSG.send( { structure: { "Table": "Printer", "Values": [order_id] } } )
};
MSG.request.dayOverPrintCheck = function () {
    var s = {
        "Table": "Printer", "TypeParameter": "AllRange",
        "Values": [Cashier.OrganizationHash, Cashier.UserHash, Page.timeBeginDay(), Page.time()]
    };
    MSG.send( { structure: s } )
};
//--------------\ CashBox |----------------------------------------------------------|


////////--------| Personal_order |----------------------------------------------------------
MSG.requestCustomer = function ( id ) {
    var s = {
        "Table": "OrderCustomer", "Query": "Read", "TypeParameter": "Value",
        "Values": [id], "Limit": 0, "Offset": 0, "ID_msg": ""
    };
    MSG.send( {
        structure: s, handler: function ( data ) {
            if ( Order.list[data["Order_id"]] ) {
                Order.list[data.Order_id].addNameCustomer( data );
            }
        }
    } )
};
//--------------\ Personal_order |----------------------------------------------------------


////////--------| MAKE ORDER |----------------------------------------------------------
MSG.order = function ( onTime, Type ) {
    console.group( 'MSG.order' );
    onTime = onTime || $( "#on_time" ).is( ":checked" );
    var TimeDelivery = onTime ?
            (document.getElementById( 'select_date' ).value + 'T' + document.getElementById( 'select_time' ).value + ':00Z')
            : EMPTY_TIME
        , CountPerson = document.getElementById( 'count_person' ).value
        , Division = $( '#to_workers' ).prop( 'checked' ) ? document.getElementById( 'input_to_workers' ).value : " "
        , bonus = 0, getPrice = Cart.getPrice(), price = getPrice[0], PriceWithDiscount = getPrice[3], discountName = getPrice[1], discountPerc = getPrice[2]
        , price_currency = "руб", NameStorage = "Курган 5 микрорайон 33" // получается с информацией о кассире
        , ost = document.getElementById( 'ostatok' ).value, note = document.getElementById( 'comment_order' ).value
        , s
        ;

    ost = (ost == "") ? "" : "Приготовить сдачу с " + ost + "<br> ";
    note = ost + note;

    s = [{
        Table: 'Order', Query: 'Create', TypeParameter: 'GetID', Values: null, Limit: 0, Offset: 0
    }, {
        ID: 0
        , SideOrder: SIDE_ORDER
        , TimeDelivery: TimeDelivery
        , DatePreOrderCook: TimeDelivery
        , CountPerson: +CountPerson
        , Division: Division
        , NameStorage: NameStorage
        , OrgHash: Cashier.OrganizationHash
        , Note: note
        , DiscountName: discountName
        , DiscountPercent: +discountPerc
        , Bonus: bonus
        , Type: /*DELIVERY*/ Type
        , Price: price
        , PriceWithDiscount: PriceWithDiscount
        , PriceCurrency: price_currency
        , TypePayments: +$( '.pay_met .active' ).prop( 'id' )
    }];
    console.log( 's', s );
    console.groupEnd();
    return s
};

MSG.sendCustomer = function ( ID ) {
    var s = MSG.customer( ID );
    MSG.send( { structure: s, check: true } );
};
MSG.customer = function ( ID ) {
    console.group( 'MSG.customer' );
    var s
        , NameCustomer = $( "#client_name" ).val() || NO_NAME
        , phone = getPhone( 'client_phone' );
    s = [{
        "Table": "OrderCustomer", "Query": "Create", "TypeParameter": "", "Values": null, "Limit": 0, "Offset": 0
    }, {
        "Order_id": +ID, "NameCustomer": NameCustomer + '', "Phone": phone + '', "Note": ''
    }];
    s[1] = MSG.clientAddress( s[1] );
    console.log( s );
    console.groupEnd();
    return s
};
MSG.cart = function ( ID ) {
    console.group( 'MSG.cart' );
    var s, ss = [], i, ii, discountName, discountPerc;
    for ( i in Cart.list ) {
        ii = Product.list[Cart.list[i].Price_id];
        discountName = Cart.list[i].DiscountName;
        discountPerc = Cart.list[i].DiscountPercent;
        s = [{
            "Table": "OrderList", "Query": "Create", "TypeParameter": "GetID",
            "Values": null, "Limit": 0, "Offset": 0
        }, {
            "Order_id": +ID, "ID_item": 1, "ID_parent_item": 0, "Price_id": ii.Price_id, "PriceName": ii.PriceName,
            "Type_id": ii.Type_id, "TypeName": ii.TypeName, "Parent_id": ii.Parent_id, "ParentName": ii.ParentName,
            "Image": ii.Image, "Units": ii.Units, "Value": ii.Value, "Set": ii.Set, "Finished": false,
            "DiscountName": discountName, "DiscountPercent": discountPerc, "Price": ii.Price,
            "CookingTracker": ii.CookingTracker, "TimeCook": ii.TimeCook, "TimeFry": ii.TimeFry
        }];
        ss.push( s );
        // MSG.send( s, false, false, false, true );
    }
    console.log( ss );
    console.groupEnd();
    return ss;
};
MSG.clientInfo = function () {
    var tel = getPhone()
        , s = [{ "Table": "ClientInfo", "TypeParameter": "Create" }
        , {
            Phone: tel
            , Name: document.getElementById( 'client_name' ).value || NO_NAME
            // , Bonus: null, BlackList: null, CauseBlackList: null, Birthday: null
        }];
    return s
};
MSG.clientInfoAddress = function ( Order_id ) {
    var s, tel = getPhone(),
        x = $( ".operator_client_adress .collapse.in" ).parent().attr( 'data-id_address' )
        ;
    if ( x != undefined && x.length ) {
        s = [{ "Table": "ClientInfo", "TypeParameter": "CreateAddress" }
            , { ID: +x, Phone: getPhone( 'client_phone' ) }];
    } else {
        s = [{ "Table": "ClientInfo", "TypeParameter": "CreateAddress" }
            , { Phone: tel, Order_id: Order_id || 0, ID: 0, ClientHash: '', Comment: '' }];
        s[1] = MSG.clientAddress( s[1] );
    }
    return s
};

MSG.collectOrder = function () {
    console.group( 'MSG.collectOrder' );
    MSG.collectOrder.list = { cart: [], customer: [], order: [], status: {}, payment: {} };
    var Type = /*Cart.getType()*/ TAKEAWAY, onTime = $( "#on_time" ).is( ":checked" )
        , note = document.getElementById( 'comment_order' ).value, note1 = document.getElementById( 'comment_order1' ).value
        // , street = $( ".operator_client_adress .collapse.in #street_client" ).val()
        // , home = $( ".operator_client_adress .collapse.in #home_number" ).val()
        , TimeDelivery = onTime ?
            (document.getElementById( 'select_date' ).value + 'T' + document.getElementById( 'select_time' ).value + ':00Z')
            : "0001-01-01T00:00:00Z"
        ;

    if ( TimeDelivery.length !== 20 ) {
        warning( 'Поле времени не векорректно.', 'alert' );
        console.groupEnd();
        throw new Error( 'Проверте поля коментария.' );
    }
    if ( note != note1 ) {
        warning( 'Проверте поля коментария.', 'alert' );
        console.groupEnd();
        throw new Error( 'Проверте поля коментария.' );
    }
    if ( Type == undefined ) {
        warning( 'Не выбран способ получения заказа.', 'alert' );
        console.groupEnd();
        throw new Error( 'Не выбран способ получения заказа.' );
    }
    if ( Cart.list.length === 0 ) {
        warning( 'Корзина пуста.', 'alert' );
        console.groupEnd();
        throw new Error( "Корзина пуста." );
    }
    // if ( document.getElementById( 'count_person' ).value == 0 ) {
    //     warning( 'Количество персон не указанно.', 'alert' );
    //     console.groupEnd();
    //     throw new Error( "Количество персон не указанно." );
    // }

    MSG.collectOrder.list.cart = MSG.cart();
    MSG.collectOrder.list.clientInfo = MSG.clientInfo();
    MSG.collectOrder.list.clientInfoAddress = MSG.clientInfoAddress();
    MSG.collectOrder.list.order = MSG.order( onTime, Type );
    MSG.collectOrder.list.customer = MSG.customer( 0 );
    MSG.collectOrder.list.status = { Status_id: onTime ? 1 : 2 };
    MSG.collectOrder.list.payment = { name: document.querySelector( '.pay_met li.active a' ).innerHTML };
    console.groupEnd();
};

MSG.sendOrder = function () {
    console.group( 'MSG.sendOrder ' );
    MSG.collectOrder();
    MSG.send( { structure: MSG.collectOrder.list.order, handler: MSG.sendOrderData, check: true } );
    console.groupEnd();
};
MSG.sendOrderData = function ( ID ) {
    console.group( 'MSG.sendOrderData' );
    try {
        var list = MSG.collectOrder.list, i, ii;
        MSG.sendPersonal( ID, 0 );
        list.customer[1].Order_id = +ID;
        MSG.send( { structure: list.customer, check: true } );
        MSG.send( { structure: list.clientInfo } );
        list.clientInfoAddress[1].Order_id = ID;
        MSG.send( { structure: list.clientInfoAddress } );
        for ( i in list.cart ) {
            ii = list.cart[i];
            ii[1].Order_id = ID;
            MSG.send( { structure: ii, check: true } );
        }
        MSG.setStatus( ID, 0, list.status.Status_id );
    } catch ( e ) {
        console.error( e );
        alert( '2 Возникли проблемы с отправкой заказа!!!' )
    }
    warning( 'Заказ #' + ID, 'info', 20000, null, true );
    // Cart.cancelOrder();
    console.groupEnd();
};
//--------------\ MAKE ORDER |----------------------------------------------------------

////////--------| ClientInfo |----------------------------------------------------------
// TODO: сделать значения адрес агазина при типе навынос
// TODO: избавление от дублирующихся адресов.
MSG.clientAddress = function ( s ) {
    var i
        , x = {
        City: $( "#city_client" ).val() || ' '
        , Street: ($( ".operator_client_adress .collapse.in #street_client" ).val() || ' ') + ''
        , House: +$( ".operator_client_adress .collapse.in #home_number" ).val() || 0
        , Building: ($( ".operator_client_adress .collapse.in #corp_str" ).val() || ' ') + ''
        , Floor: +$( ".operator_client_adress .collapse.in #level" ).val() || 0
        , Apartment: +$( ".operator_client_adress .collapse.in #kv_of" ).val() || 0
        , Entrance: +$( ".operator_client_adress .collapse.in #podyezd" ).val() || 0
        , DoorphoneCode: ($( ".operator_client_adress .collapse.in #cod" ).val() || ' ') + ''
    };
    if ( x.Street === ' ' && x.House === 0 && Cart.getType() === TAKEAWAY ) {
        var zz = Cashier.OrganizationName.split(';');
        x.City = zz[0]; x.Street = zz[1]; x.House = +zz[2];
    }
    if ( s != undefined ) {
        for ( i in x ) {
            s[i] = x[i];
        }
        return s;
    } else {
        return x;
    }
};

MSG.requestCustomerByTel = function () {
    var tel = getPhone(), s = {
        "Table": "OrderCustomer", "Query": "Read", "TypeParameter": "RangeByPhone", "Values": [tel], "Limit": 999,
        "Offset": 0
    };
    MSG.send( { structure: s, handler: MSG.get.CostumerInfoByTel, mHandlers: true } );
    Customer.list = [];
};
MSG.get.CostumerInfoByTel = function ( data ) {
    if ( data.Order_id !== 0 ) {
        new Customer( data );
    }
};

// MSG.request.clientInfo = function ( tel ) {
//     tel = getPhone();
//     var s = { "Table": "ClientInfo", "Values": [tel] };
//     MSG.send( s, MSG.get.clientInfo )
// };
MSG.request.clientInfo = function ( tel ) {
    tel = tel || getPhone();
    var s = { "Table": "ClientInfo", "TypeParameter": "ReadClient", "Values": [tel] };
    MSG.send( { structure: s, handler: MSG.get.clientInfo } );
    s = { "Table": "ClientInfo", "TypeParameter": "ReadAddress", "Values": [tel] };
    MSG.send( { structure: s, handler: MSG.get.clientInfoAddress, mHandlers: true } );
    MSG.clients = [];
};
MSG.get.clientInfoAddress = function ( data ) {
    $( "#accordion1" ).append( makeAddress( data, $( '#accordion1>div' ).length, data.ID ) )
};
MSG.get.clientInfo = function ( data ) {
    // {"Hash":"628b73e45d003f334fb0ee9f87dc12ee11ef6cd8df4bd5a8b8cfc94ae28d2f98","Phone":"77777777777","Name":"Ltybc","Password":"","Mail":"","Bonus":0,"BonusWord":"","Active":false,"BlackList":false,"CauseBlackList":"","Birthday":"0001-01-01T00:00:00Z","CreationTime":"2017-04-25T12:50:26.113092Z"}
    var s;
    if ( data.BlackList ) {
        s = ALERT_CLIENT_IN_BLACK_LIST
    } else {
        s = ""
    }
    document.getElementById( 'black_list' ).innerHTML = s
};
// MSG.set.clientInfoInBlackList = function (  ) {
//     var s = {"Table":"ClientInfo","TypeParameter":"Update","ID_msg":""}{замаршалиная структура}
// };
MSG.clients = [];
//--------------\ ClientInfo |----------------------------------------------------------;


////////--------| Получение_кakoго ни-бдуь |----------------------------------------------------------
MSG.request.personal = function ( HashOrg, RoleHash, handler, mHandler ) {
    console.group( 'MSG.request.personal' );
    var s = {
        "Table": "Session", "TypeParameter": "ReadHashNotRights", "Values": [HashOrg + '', RoleHash + ""]
    };
    MSG.send( { structure: s, handler: handler, mHandlers: true, EOFHandler: mHandler || false } );
    MSG.get._personal = {};
    console.groupEnd();
};
MSG.get.personal = function ( data ) {
    MSG.get._personal[data.UserHash] = data;
};
MSG.sendPersonal = function ( ID, Order_id_item, del ) {
    //{"Table":"OrderPersonal","Query":"Create","TypeParameter":"","Values":null,"Limit":0,"Offset":0}{"Order_id":14,"Order_id_item":1,"UserHash":"aksjdghakjsdghkajs","FirstName":"FirstName","SecondName":"SecondName","SureName":"SureName","RoleHash":"Role","RoleName":"RoleName"}
    console.group( 'MSG.sendPersonal' );
    var cassir = del || Cashier;
    var s = [{
        "Table": "OrderPersonal", "Query": "Create", "TypeParameter": "", "Values": null, "Limit": 0, "Offset": 0
    }, {
        "Order_id": +ID, "Order_id_item": +Order_id_item, "UserHash": cassir.UserHash, "FirstName": cassir.FirstName,
        "SecondName": cassir.SecondName, "SurName": cassir.SurName, "RoleHash": cassir.RoleHash,
        "RoleName": cassir.RoleName
    }];
    console.log( 's', s );
    MSG.send( { structure: s, check: true } );
    console.groupEnd();
};
MSG.request.orderPersonal = function ( ID, Role, fn ) {
    var s = {
        "Table": "OrderPersonal", "Query": "Read", "TypeParameter": "RangeRole"
        , "Values": [ID, Role]
        , "Limit": 10, "Offset": 0
    };
    MSG.send( { structure: s, handler: fn, mHandlers: true } )
};
//--------------\ Получение_кakoго ни-бдуь |----------------------------------------------------------

////////--------| PRODUCT |----------------------------------------------------------
MSG.requestProducts = function () {
    var s = { "Table": "ProductOrder" };
    MSG.send( { structure: s, handler: Product, mHandlers: true, EOFHandler: MSG.request.AvailableProd } )
};
MSG.request.AvailableProd = function ( OrgHash ) {
    var s = {
        "Table": "ProductOrder", "TypeParameter": "OrgHash", "Values": [OrgHash || Cashier.OrganizationHash],
        "ID_msg": "productOrg"
    };
    MSG.send( { structure: s, handler: MSG.get.AvailableProd, mHandlers: true } );
};
MSG.get.AvailableProd = function ( data ) {
    var el = document.querySelector( 'li[data-hash="' + data.ProdHash + '"]' );
    if ( el !== null ) {
        if ( data.StopList ) {
            el.classList.add( 'stop_list_product' );
        } else {
            el.classList.remove( 'stop_list_product' );
        }
    }
};
//--------------\ PRODUCT |----------------------------------------------------------

////////--------| Promotions |----------------------------------------------------------
if ( TEST ) {
    MSG.request.promotions = function () {
        var s = { "Table": "ProductOrder", "TypeParameter": "Promotions" };
        MSG.send( {
            structure: s, handler: function ( data ) {
                new Promotion( data );
            }, mHandlers: true

            , EOFHandler: function () {
                s = { "Table": "ProductOrder", "TypeParameter": "Subjects" };
                MSG.send( {
                    structure: s, handler: Promotion.Subjects, mHandlers: true,
                    EOFHandler: Promotion.setup
                } );
            }
        } );
    };
} else {
    MSG.request.promotions = function () {
        Promotion._getAllCounter = 0;

        var s = { "Table": "ProductOrder", "TypeParameter": "PromotionsTypes" };
        MSG.send( { structure: s, handler: PromotionType, mHandlers: true, EOFHandler: Promotion._getAll } );
        s = { "Table": "ProductOrder", "TypeParameter": "Promotions" };
        MSG.send( {
            structure: s, handler: function ( data ) {
                new Promotion( data )
            }, mHandlers: true, EOFHandler: Promotion._getAll
        } );
        s = { "Table": "ProductOrder", "TypeParameter": "Subjects" };
        MSG.send( { structure: s, handler: PromotionSubjects, mHandlers: true, EOFHandler: Promotion._getAll } );
    };
}
//--------------\ Promotions |----------------------------------------------------------

////////--------| Organization |----------------------------------------------------------
MSG.requestOrganization = function ( city ) {
    city = city || document.getElementById( 'city_client' ).value;
    if ( !Array.isArray( city ) ) {
        city = [city];
    }
    MSG.send( { "Table": "GetPoint", "Values": city }, MSG.get.Organization, true );
    document.getElementById( 'take_away_address' ).innerHTML = '';
};
MSG.get.Organization = function ( data ) {
    new Organization( data );
};
//--------------\ Organization |----------------------------------------------------------
////////--------| DeliveryZone |----------------------------------------------------------
MSG.requestDeliveryZone = function ( city, street, house ) {
    var s, i;
    city = city || $( "#city_client" ).val();
    street = street || $( ".operator_client_adress .collapse.in #street_client" ).val();
    house = house || $( ".operator_client_adress .collapse.in #home_number" ).val();
    if ( Cart.getType() == DELIVERY ) {
        for ( i in Organization.list ) {
            Organization.list[i].disableSelect();
        }
    }
    $( '#take_away_address' ).prop( 'selectedIndex', -1 );

    if ( (street == "" && house == "") || (!street && !house) ) {
        $( "#warning_dellivery" ).html( "Выберите адрес" ).css( "color", "red" );
        return;
    } else if ( city == "" || city == undefined ) {
        $( "#warning_dellivery" ).html( "Введите город" ).css( "color", "red" );
        return;
    } else if ( street == "" || street == undefined ) {
        $( "#warning_dellivery" ).html( "Введите улицу" ).css( "color", "red" );
        return;
    } else if ( house == "" || house == undefined ) {
        $( "#warning_dellivery" ).html( "Введите номер дома" ).css( "color", "red" );
        return;
    } else {
        $( "#warning_dellivery" ).html( "" );
    }

    //if (house!="")
    s = {
        "Table": "GetAreas", "TypeParameter": "WithHouse", "Values": [city, street, house]
    };
    MSG.send( s, MSG.get.DeliveryZone );
    // ----БЕЗ ДОМА
    //else ws.send({"Table":"GetAreas","TypeParameter":"NotWithHouse","Values":[city,street]});
};
MSG.get.DeliveryZone = function ( data ) {
    var i, ii;
    if ( data.Exist ) {
        for ( i in data.HashList ) {
            ii = data.HashList[i];
            Organization.list[ii].enableSelect();
        }
        document.getElementById( 'take_away_address' ).value = data.HashList[0]
    }
};
//--------------\ DeliveryZone |----------------------------------------------------------

