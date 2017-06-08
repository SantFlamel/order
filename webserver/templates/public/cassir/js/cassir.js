// TODO: подсчёт заказов на кнопках делать через поиск '.orders_li.ord'.length
// TODO: поиск по тлелефону заказов
// TODO: сделать постраничную навигацию без привязки к колличеству елементов на странице

// TODO: убрать waitProp( function () {   из   .addStatus
function Cassir() {
}
Cassir.elem = {
    nextBtn: '<li class="orders_li btn next_page" style="height: calc( 25% - 1px); display: none ;background-color: #006dcc"><a class="orders">Следующая</a></li>',
    prevBtn: '<li class="orders_li btn prev_page" style="height: calc( 25% - 1px); display: none ;background-color: #006dcc"><a class="orders">Предыдущая</a></li>',
    empty: '<li class="orders_li empty" style="display: none"><a class="orders"></a></li>'
};


Cassir.flippIndex = 0; // переменная листалка
Cassir.FlippingFunc = {
    next: function () {
        Cassir.flippIndex += 20;
        $( '.orders_li:hidden:lt(' + Cassir.flippIndex + ')' ).css( 'display', '' );
        $( '.orders_li:visible:lt(' + Cassir.flippIndex + ')' ).css( 'display', 'none' );
    }, prev: function () {
        var index1 = Cassir.flippIndex - 21;
        $( '.orders_li' ).css( 'display', 'none' );
        // если должны отобразится первые 20, то gt() не используется. - (index1 > 0 ? ':gt(' + index1 + ')' : '')
        $( '.orders_li:lt(' + Cassir.flippIndex + ')' + (index1 > 0 ? ':gt(' + index1 + ')' : '') )
            .css( 'display', '' );
        Cassir.flippIndex -= 20;
    }
};
var ELEM_ON_PAGE = 20
    // $( '.orders_li' )
    , $btn = $( '.orders_li.btn' )
    ;
Cassir.flippPage = 0;
Cassir.showBtnFlipping = function ( po, recursion ) {
    po = po || (ELEM_ON_PAGE - 1);
    if ( !recursion ) {
        $btn.remove();
    }
    if ( $( '.orders_li:gt(' + (po) + ')' ).length !== 0 ) {
        $( '.orders_li:eq(' + po + ')' ).before( Cassir.elem.nextBtn ).before( Cassir.elem.prevBtn );
        if ( $( '.orders_li:gt(' + (po + ELEM_ON_PAGE) + ')' ).length !== 0 ) {
            Cassir.showBtnFlipping( po + ELEM_ON_PAGE, true ); // рекурсия тут!!!
        }
    }
};
Cassir.showPage = function () {
    var pageCount = Math.ceil( document.querySelectorAll( '.orders_li' ).length / ELEM_ON_PAGE );
    if ( Cassir.flippPage >= pageCount ) {
        Cassir.flippPage = pageCount - 1;
    }
    if ( Cassir.flippPage < 0 ) {
        Cassir.flippPage = 0;
    }
    $( '.orders_li' ).css( 'display', 'none' );
    var eq = Cassir.flippPage * ELEM_ON_PAGE
        , gt = eq === 0 ? eq : eq - 1
        , lt = eq === 0 ? ELEM_ON_PAGE - 1 : ELEM_ON_PAGE
        , sel = '.orders_li:eq(' + eq + '), .orders_li:gt(' + gt + '):lt(' + (lt) + ')';
    console.log( 'Sel', sel );
    $( sel ).css( 'display', '' );
};
$( 'body' ).off( 'click', '.next_page' ).off( 'click', '.prev_page' ).on( 'click', '.next_page', function () {
    Cassir.flippPage++;
    Cassir.showPage();
} ).on( 'click', '.prev_page', function () {
    Cassir.flippPage--;
    Cassir.showPage();
} );
// делаем все елементы видимыми -> скрываем не нужные
// -> делаем листалки игнорируя скрытые -> оставляем только первые 20 елементов
// Cassir.sortedOrders = [];
// Cassir.sortOrders = function () {
//     // console.group( 'sortOrders' );
//     function com( el, el1 ) {
//         var time = Order.list[el].time, time1 = Order.list[el1].time;
//         time = new Date( time[0], time[1], time[2], time[3], time[4], time[5] );
//         time1 = new Date( time1[0], time1[1], time1[2], time1[3], time1[4], time1[5] );
//         // console.log( time, time1 );
//         return time - time1;
//     }
//
//     Cassir.sortedOrders = [];
//     for ( var i in Order.list ) {
//         Cassir.sortedOrders.push( +i );
//     }
//     Cassir.sortedOrders.sort( com );
//     // console.groupEnd();
// };

// : V сделать отображение даты начала готовки.
// : V время заказа
function Order( data ) {
    // console.group( 'ORDER', data );
    var d, t;
    if ( typeof data === 'object' ) {
        for ( var i in data ) {
            this[i] = data[i];
        }
    }
    d = this.DatePreOrderCook.split( 'Z' )[0].split( 'T' );
    t = d[1];
    d = d[0];
    this.DatePreOrderCook = d.concat( t );
    this.time = Page.timeToArray( this.Order_time );
    this.state = [];

    if ( this.Type == TAKEAWAY ) {
        this.state.push( 'take_away' )
    } else if ( this.Type == DELIVERY ) {
        this.state.push( 'on_delivery' )
    }

    if ( this.Division !== ' ' ) {
        this.state.push( 'to_workers' )
    }
    Order.list[this.ID] = this;
    // this.appendInPage();

    MSG.request.customer( this.ID );
    // console.groupEnd();
}
Order.$orderFeeld = $( '#order_block' );
Order.list = {};
Order.prototype.addStatus = function ( data ) {
    // console.group( 'addStatus' );
    // console.log( 'this, data', this, data );
    if ( data.Order_id_item === 0 ) { // для всего заказа
        // console.log( '1  data.Status_id , STATUS[(data.Status_id || 2)].Name', data.Status_id, STATUS[(data.Status_id || 2)].Name );
        this.status = data.Status_id || 2;
        this.statusT = STATUS[this.status].Name;
        if ( this.status == 4 ) {
            this.state.push( 'in_work' )
        }
        if ( this.status == 10 ) {
            this.state.push( 'remake' )
        }
        this.showOrder();
    } else { // для елемента заказа
        var d = data, self = this;
        console.log( '2  d.Status_id, STATUS[d.Status_id][\"Name\"]', d.Status_id, STATUS[d.Status_id].Name );
        waitProp( function () {
            if ( self.OrderList[d.Order_id_item].CookingTracker === 0 && d.Status_id < 9 ) {
                d.Status_id = 8;
                d.Finished = true;
            }
            self.OrderList[d.Order_id_item].status = d.Status_id;
            self.OrderList[d.Order_id_item].statusT = STATUS[d.Status_id].Name;
            try {
                self.updateStatusForDescription();
            } catch ( e ) {
            }
        }, function () {
            return self.OrderList
        }, 300, 10 )
    }
    // console.groupEnd();
};

Order.prototype.showOrder = function () {
    var state = +document.querySelector( '#cassir_tab li.active' ).dataset.status;
    if ( ((state === 0) &&
        (  this.status === 11 || this.status === 15 || this.status === 16 /* доставлен, отменён, отменён */
        || this.status === 1    /* предзаказ*/
        || this.status === 10     /*доставляется*/
        || this.status === 13))   /*Заказ не забрали*/
        || ((state === 999) && !( this.status === 11 || this.status === 15 || this.status === 16 /* доставлен, отменён, отменён */)) ) {
        this.deleteOrder( true );
        wait( 'Order.updateView', Order.updateView, 100 );
        return;
    }
    if ( this.status !== state && !(state === 0 || state === 999) ) {
        this.deleteOrder( true );
        wait( 'Order.updateView', Order.updateView, 100 );
        return;
    }
    this.addOrder();
};
Order.updateView = function () {
    $( '.orders_li.empty' ).remove();
    $( '.orders_li.btn' ).remove();
    Cassir.showBtnFlipping();
    Cassir.showEmptyElem();
    Cassir.showPage();
};
Order.prototype.addOrder = function () {
    var elem = document.querySelectorAll( '.orders_li.ord' )
        , len = elem.length, i, y, x;
    if ( document.querySelector( '#ord_' + this.ID ) ) {
        this.updateElementStatus();
        clearInterval( this.timerWorck );
        this.setupTimer();
    } else {
        this.makeOrderElement();
        if ( len < 2 ) {
            Order.$orderFeeld.append( this.orderElement );
        } else {
            for ( i = 0; i < len; i++ ) {
                y = +elem[i].dataset.id;
                if ( y > this.ID ) {
                    $( '#ord_' + y ).before( this.orderElement );
                    y = false;
                    break;
                }
                x = y;
            }
            if ( y ) {
                $( '#ord_' + y ).after( this.orderElement );
            }
        }
        this.setupTimer();
        wait( 'Order.updateView', Order.updateView, 100 );
    }
};

Order.showOrders = function () {
    var i, ii;
    Cassir.flippIndex = 0;
    Order.$orderFeeld.empty();
    for ( i in Order.list ) {
        ii = Order.list[i];
        ii.showOrder();
    }
};

Order.prototype.addNameCustomer = function ( data ) {
    this.NameCustomer = data.NameCustomer;
    var ID = this.ID, NameCustomer = this.NameCustomer;
    waitProp( function () {
        document.querySelector( '#state_' + ID + ' .name' ).innerHTML = NameCustomer
    }, function () {
        return document.querySelector( '#state_' + ID + ' .name' );
    }, 2000, 3 );

    this.Custumer = data;
};

Order.prototype.setupTimer = function () {
    // console.assert( this.ID !== 3, "заказ #3" );
    // console.assert( this.ID !== 4, "заказ #4" );
    if ( this.timerWorck ) {
        clearInterval( this.timerWorck )
    }
    this.sel = $( '#time_' + this.ID );
    var z = this.status;
    if ( z === 1 ) {
        this.sel.html( Page.timeReplace( this.TimeDelivery ) );// TEST
        return;
    } else if ( z === 15 || z === 16 || z === 11 ) {
        var t2 = this.time;
        this.sel.html( t2[0] + '-' + t2[1] + '-' + t2[2] + ' ' + t2[3] + ':' + t2[4] );// TEST
        return;
    }
    var now = new Date() // гггг, м, дд // получаем текущую дату.
        , t = this.time, self = this, late = true, time_out = true, d, h, m, s;
    now.setFullYear( t[0], +t[1] - 1, t[2] ); // выставляем дату
    now.setHours( t[3], t[4], t[5] ); // выставляем время заказа

    // console.assert( self.ID != 10, 'timerSET2222222222222' );
    this.timer = function () {
        s = (new Date()) - now;
        s = division( s, 1000 );

        h = division( s, 3600 );
        s -= h * 3600;

        m = division( s, 60 );
        s -= m * 60;

        // d = division( s, 24);
        // s -= d * 24;
        if ( m > 14 || h > 0 || d > 0 ) {
            if ( late && !~self.state.indexOf( 'late' ) ) {
                self.state.push( 'late' );
                self.updateElementStatus();
                late = false;
            }
            if ( time_out && (m > 29 || h > 0 || d > 0) ) {
                if ( time_out && !~self.state.indexOf( 'time_out' ) ) {
                    self.state.push( 'time_out' );
                    self.updateElementStatus();
                    time_out = false;
                }
            }
        }
        self.sel.html(
            ((h != 0) ? ((h < 10 ? '0' + h : h) + ':') : '' )
            + (m < 10 ? '0' + m : m) + ':'
            + (s < 10 ? '0' + s : s) );
    };
    this.timer();
    this.timerWorck = setInterval( self.timer, /*(self.sel.is( ':visible' ) ?*/ 1000 /*: 5000)*/ );
};
if ( TEST ) {

}
Order.prototype.makeOrderElement = function () {
    this.orderElement =
        '<li data-id="' + this.ID + '" id="ord_' + this.ID + '" class="orders_li ord"><a id="state_' + this.ID +
        '" class="' + this.state.join( ' ' ) + '" ><p class="name">'
        + (this.NameCustomer || '') + '</p><p class="number">#' + this.ID + '</p><p class="status">' + (this.statusT || '') + '</p><p id="time_' + this.ID +
        '"></p><i class="fa fa-rotate-right"></i><i class="download"></i><i class="upload"></i><i class="alarm"></i></a></li>';
};
Order.prototype.deleteOrder = function ( full ) {
    // без full удаляется только елемент на странице.
    // console.log( 'DELETE this.ID', this.ID );
    $( '#ord_' + this.ID ).remove();
    clearInterval( this.timerWorck );
    if ( !full ) { // если удалять много то данные действия можно пропустить. но выполнить их для всех.
        // var index = Cassir.sortedOrders.indexOf( this.ID );
        // Cassir.sortedOrders.splice( index, 1 ); // удаляем из сортированного списка
        delete Order.list[this.id];
        Cassir.showBtnFlipping();
        Cassir.showEmptyElem();
        Cassir.updateDisplay(); // отображаем нужную страницу.
    }
};
Order.prototype.appendInPage = function () {
    this.makeOrderElement();
    Order.$orderFeeld.append( this.orderElement );
    this.setupTimer();
};

Order.prototype.updateElementStatus = function () {
    var selector = '#state_' + this.ID;
    $( selector ).removeClass().addClass( this.state.join( ' ' ) );
    $( selector + ' .status' ).html( this.statusT );
};

Cassir.showEmptyElem = function () {
    // добавляет пустые ячейки на страницу. или удаляет их.
    if ( document.getElementsByClassName( 'orders_li empty' ).length > 19 ) {
        var em = 20 - document.querySelectorAll( '.orders_li:not(.empty)' ).length % 20;
        $( '.orders_li.empty:gt(' + (+em - 1) + ')' ).remove();
    } else {
        var emptyPos = (20 - document.getElementsByClassName( 'orders_li' ).length % 20), count = 0;
        if ( emptyPos < 20 ) {
            while ( count < emptyPos ) {
                Order.$orderFeeld.append( Cassir.elem.empty );
                count++;
            }
            if ( document.getElementsByClassName( 'orders_li' ).length < 21 ) {
                // скрываем пустые елементы
                $( '.orders_li.empty' ).css( 'display', '' );
            }
        }
    }
};
Cassir.timeOut = {};

Cassir.stopTimer = function () {
    for ( var i in Order.list ) {
        if ( Order.list[i].hasOwnProperty( 'timer' ) ) {
            delete Order.list[i].timer;
            clearInterval( Order.list[i].timerWorck );
        }
    }
};


////////--------| SEARCH |----------------------------------------------------------
Order.find = function ( val ) {
    val += '';
    var i, ii, _id, result = [];
    for ( i in Order.list ) {
        ii = Order.list[i];
        _id = ii.ID + '';
        if ( (~_id.indexOf( val ) || _id == val)
            || ( ~ii.Custumer.Phone.indexOf( val ) || ii.Custumer.Phone == val ) ) {
            result.push( i );
        }
    }
    return (result.length === 0 ? null : result);
};

var $search = $( '#search' );
$( '#cassir .fa.fa-search' ).click( function ( event ) {
    if ( $search.is( ':visible' ) ) {
        $search.hide();
    } else {
        $search.show().css( 'left', event.clientX - 180 ).css( 'top', event.clientY - 15 );
        $( '#search-input' ).focus();
        var x = function () {
            $search.hide();
            $( document ).off( 'click', x )
        };
        $( document ).on( 'click', x );
    }
    return false
} );
$( document ).on( 'keyup', '#search-input', function () {
    var result = Order.find( this.value )
        , i, ii, ord, tel, ad, id, index, elem = '';
    if ( result ) {
        result = result.splice( 0, 20 );
        index = result.indexOf( this.value );
        if ( ~index ) {
            id = result.splice( index, 1 );
            result.unshift( id );
        }
    }
    for ( i in result ) {
        ii = result[i];
        ord = Order.list[ii];
        tel = ord.Custumer.Phone == ' ' ? '' : ord.Custumer.Phone;
        ad = ord.address();
        ad = ad == '' ? '' : '<div class="blue_txt address">' + ad + '</div>';
        elem += '<div data-id="' + ii + '" class="result-search">#<span>' + ii + '</span> тел:<span class="telephone">'
            + ord.Custumer.Phone + '</span>'
            + ad + '</div>';
    }
    document.getElementById( 'result-search' ).innerHTML = elem;
} );
$( '#search-input' ).click( '#search-input', function () {
    this.value = '';
    document.getElementById( 'result-search' ).innerHTML = '';
    return false;
} );
//--------------\ SEARCH |----------------------------------------------------------

$( document ).on( 'click', '#cassir_tab li[data-status]', function () {
    Order.showOrders();
} );

$( document ).on( 'dblclick', '#logout', function () {
    MSG.close.session();
    document.location.href = AUTH_URL;
} );

$( document ).on( 'click', '#new_order', function () {
    Page.show.Carts();
    Page.show.makeOrder();
} );
// $( document ).on( 'click', '#btn_take_away', function () {
//     Page.show.Carts();
//     $( '#new_order_route' ).modal( 'hide' );
// } );
// $( document ).on( 'click', '#btn_preorder', function () {
//     Page.show.Operator();
//     $( '#new_order_route' ).modal( 'hide' );
// } );

// переключалка онлайн оффлайн
$( document ).on( 'click', '#mode_tel', function () {
    var elem = $( this );
    if ( elem.hasClass( 'fa-toggle-on' ) ) {
        elem.removeClass( 'fa-toggle-on' ).addClass( 'fa-toggle-off' )
    } else {
        elem.removeClass( 'fa-toggle-off' ).addClass( 'fa-toggle-on' )
    }
} );

