// : V не блокируется кнопка собрать после сборки
// : V отображение информации о назначенном курьере.
// TODO: отображать время к которому доставить
// TODO: сделать отображение курьера назначенного на заказ,
// TODO: при сборке запроса печать чек

// {"Table":"OrderPersonal","Query":"Create","TypeParameter":"","Values":[40,0,"1","1"]
// ,"Limit":0,"Offset":0,"ID_msg":"1854b653819e6cdd44feb00321e54cf398cba9672e78ec9ba9ad1c6b92de8b47e8d97f5788450778d89d646a054e451e341946a8f87e57edc8681a27e0e065d0"}
Order.check = function () {
    console.group( 'Order.check' );
    var ord = Order.list[document.title.split( '#' )[1]]
        , i, ii, j, jj
        ;

    ////////--------| ready |----------------------------------------------------------
    function checkReady() {
        var all9 = true;
        for ( i in ord.countedElements ) {
            ii = ord.countedElements[i];
            if ( ii.hasOwnProperty( 'child' ) ) {
                for ( j in ii.child ) {
                    jj = ii.child[j];
                    if ( !jj.ready && jj.status !== 9 ) {
                        return false;
                    }
                    if ( jj.status !== 9 ) {
                        all9 = false
                    }
                }
            } else {
                if ( !ii.ready && ii.status !== 9 ) {
                    return false;
                }
                if ( ii.status !== 9 ) {
                    all9 = false
                }
            }
        }
        return !all9
    }

    function deleteReady() {
        for ( i in ord.countedElements ) {
            ii = ord.countedElements[i];
            if ( ii.hasOwnProperty( 'child' ) ) {
                for ( j in ii.child ) {
                    ii.child[j].ready = false;
                }
            } else {
                ii.ready = false;
            }
        }
    }

    function checkDelivery() {
        for ( i in ord.countedElements ) {
            ii = ord.countedElements[i];
            if ( ii.hasOwnProperty( 'child' ) ) {
                for ( j in ii.child ) {
                    jj = ii.child[j];
                    if ( jj.status != 9 ) {
                        console.log( 'jj.status', jj.status );
                        return false;
                    }
                }
            } else {
                if ( ii.status != 9 ) {
                    console.log( 'ii.status', ii.status );
                    return false;
                }
            }
        }
        return true;
    }

    if ( checkReady() ) {
        $( '#ready_order' ).attr( 'disabled', false ).removeClass( 'btn-order-ready__disabled' );
        document.getElementById( 'ready_order' ).innerHTML = 'Собранно';
        document.getElementById( 'ready_order' ).onclick = function () {
            var x = ord;
            deleteReady();
            return function () {
                x.setStatus( 9 );
                setTimeout( Order.check, TIMEOUT_UPDATE );
                if ( x.Type === DELIVERY && x.notPayment > 0 ) {
                    new Operation( x.TypePayments, x.notPayment, 'Авто-плата при выдаче курьеру. #' + x.ID, x.ID );
                }
            }
        }();
    } else if ( checkDelivery() ) {
        MSG.request.orderPersonal( ord.ID, DELYVERYMAN_HASH, function () {
            document.getElementById( 'order_type' ).innerHTML = DELIVERY + ' V';
            $( '#ready_order' ).attr( 'disabled', true ).addClass( 'btn-order-ready__disabled' ).attr( 'data-id', '' );
            document.getElementById( 'ready_order' ).innerHTML = 'Готово';
        } );
        if ( ord.Type === TAKEAWAY ) {
            document.getElementById( 'ready_order' ).innerHTML = 'Выдача';
            document.getElementById( 'ready_order' ).onclick = function () {
                var x = ord;
                return function () {
                    if ( document.getElementById( 'payment_over' ).innerHTML === 'Оплачено' ) {
                        x.setStatus( 11 );
                        Order.check();
                    } else {
                        alert( 'Заказ не оплачен!!!' )
                    }
                }
            }();
        } else if ( ord.Type === DELIVERY ) {
            document.getElementById( 'ready_order' ).innerHTML = 'Назначить курьера';
            document.getElementById( 'ready_order' ).onclick = function () {
                return function () {
                    Order.setDeliveryMan();
                    Order.check();
                }
            }();
        } else {
            console.groupEnd();
            return;
        }
        $( '#ready_order' ).attr( 'disabled', false ).removeClass( 'btn-order-ready__disabled' ).attr( 'data-id', ord.ID );
    } else {
        $( '#ready_order' ).attr( 'disabled', true ).addClass( 'btn-order-ready__disabled' ).attr( 'data-id', '' );
        document.getElementById( 'ready_order' ).innerHTML = 'Готово';
    }
    console.groupEnd();
    //--------------\ ready |----------------------------------------------------------
};


///  Ометить готовность наименования
$( document ).on( 'click', '.status-ready + .table-order__spoiler-content tr:not(.row-highlight), tr:not(.row-highlight).table-order__no-spoiler.status-ready', function () {
    $( this ).addClass( 'row-highlight' );
    $( this ).find( '.btn-switch-img' ).addClass( 'btn-switch-img__white' );
    $( this ).find( '.btn-refresh' ).addClass( 'btn-refresh__white' );
    var self = Order.list[this.dataset.id], Price_id1 = this.dataset.price_id, Price_id2 = this.dataset.id_parent;
    self.setReady( Price_id1, Price_id2 );
    Order.check();
} );

////////--------| Доставка |----------------------------------------------------------
Order.setDeliveryMan = function () {
    MSG.request.personal( Cashier.OrganizationHash, DELYVERYMAN_HASH, MSG.get.personal, Order.setDeliveryManShow );
};
Order.setDeliveryManShow = function () {
    console.group( 'Order.setDeliveryManShow' );
    console.log( 'MSG.get._personal', MSG.get._personal );
    var el = 'Курьеры: </br>', i, ii;
    $( '#deliveryman' ).modal( 'show' );
    for ( i in MSG.get._personal ) {
        ii = MSG.get._personal[i];
        console.log( 'MSG.get._personal[i]', MSG.get._personal[i] );
        if ( $( 'input [value="' + ii.UserHash + '"]' ).length == 0 && ii.SessionData.split( '|' )[2] == 'true' ) {
            el += '<label><input type="radio" name="deliveryman" value="' + ii.UserHash + '"/> ' + ii.SurName + ' ' +
                ii.FirstName + ' ' + ii.SecondName + '</label>';
        }
    }
    console.log( 'el', el );
    if ( el ) {
        document.getElementById( 'txt_deliveryman' ).innerHTML = el;
    }
    console.groupEnd();
};


Order.prototype.setReady = function ( Price_id1, Price_id2 ) {
    if ( Price_id1 == Price_id2 ) {
        this.countedElements[Price_id1].ready = true;
    } else if ( Price_id2 == undefined ) {
        this.countedElements[Price_id1].ready = true;
    } else {
        this.countedElements[Price_id2].child[Price_id1].ready = true;
    }
};

$( document ).on( 'click', '#btn_deliveryman', function () {
    if ( document.querySelectorAll( 'input[name="deliveryman"]:checked' ).length != 0 ) {
        var hash = document.querySelector( 'input[name="deliveryman"]:checked' ).value;
        MSG.set.personal( document.title.split( '#' )[1], 0, MSG.get._personal[hash] );
    }
    $( '#deliveryman' ).modal( 'hide' );
    Order.check();
} );
//--------------\ Доставка |----------------------------------------------------------

Order.prototype.setStatus = function ( st, ol ) {
    var i, ii;
    if ( this.status < st && !ol ) {
        MSG.set.status( this.ID, 0, st );
    }
    for ( i in this.OrderList ) {
        ii = this.OrderList[i];
        if ( ii.status < st ) {
            MSG.set.status( this.ID, ii.ID_item, st );
        }
    }
};

Order.prototype.countElements = function () {
    if ( !this.hasOwnProperty( 'OrderList' ) ) {
        var self = this;
        wait( 'countElements', function () {
            waitProp( function () {
                    self.countElements();
                }, function () {
                    return self.OrderList;
                }, 300, 10
                , function () {
                    warning( 'Заказ #' + this.ID + ' пустой!!!' );
                } )
        }, 0 );

        return;
    }
    if ( this.OrderList['undefined'] ) {
        delete this.OrderList['undefined'];
    }
    var el = {}, i, cc;
    for ( i in this.OrderList ) if ( i != 'undefined' ) {
        i = this.OrderList[i];
        if ( i.ID_parent_item === 0 ) {
            if ( !el.hasOwnProperty( i.ID_item ) ) {
                el[i.ID_item] = {
                    count: 1, Price_id: i.Price_id
                    , ID_items: [i.ID_item]
                    , PriceName: i.PriceName
                    , Finished: i.Finished, i: i
                    , ID_parent_item: i.ID_parent_item
                    , set: i.Set, Image: i.Image
                    , ready: false
                    , CookingTracker: i.CookingTracker
                };
            } else {
                el[i.ID_item].count += 1;
                el[i.ID_item].ID_items.push( i.ID_item );
            }
        } else {
            if ( !el.hasOwnProperty( i.ID_parent_item ) ) {
                el[i.ID_parent_item] = {};
            }
            if ( !el[i.ID_parent_item].hasOwnProperty( 'child' ) ) {
                el[i.ID_parent_item].child = {};
            }
            // console.log( el, i );
            if ( !el[i.ID_parent_item].child.hasOwnProperty( i.Price_id ) ) {
                // console.log( 'make el else', i );
                el[i.ID_parent_item].child[i.Price_id] = {
                    count: 1
                    , Price_id: i.Price_id
                    , ID_items: [i.ID_item]
                    , PriceName: i.PriceName
                    , Finished: i.Finished, i: i
                    , ID_parent_item: i.ID_parent_item
                    , set: i.Set, Image: i.Image
                    , ready: false
                    , CookingTracker: i.CookingTracker
                };
            } else {
                cc = el[i.ID_parent_item].child[i.Price_id];
                cc.count += 1;
                cc.ID_items.push( i.ID_item );
            }
        }
    }
    this.countedElements = el;
    this.countedGrouped();
};

Order.prototype.countedGrouped = function () {
    var i, el = this.countedElements, ii, j, jj, el2 = {};
    for ( i in el ) {
        ii = el[i];
        if ( !Order.except( i.Price_id ) ) {
            if ( !el2.hasOwnProperty( ii.Price_id ) ) {
                el2[ii.Price_id] = ii
            } else {
                el2[ii.Price_id].count += ii.count;
                el2[ii.Price_id].ID_items = el2[ii.Price_id].ID_items.concat( ii.ID_items );
                for ( j in el2[ii.Price_id].child ) {
                    jj = el2[ii.Price_id].child[j];
                    jj.count += ii.child[j].count;
                    jj.ID_items = jj.ID_items.concat( ii.child[j].ID_items );
                }
            }
        }
    }
    this.countedElements = el2;
    this.statusCounted();
};

////////--------| првоерки и установка стутусов |----------------------------------------------------------
Order.checkStatus = function ( z ) {
    if ( ~z.indexOf( 2 ) && z.length === 1 ) { // у всех статус 2
        return 2;
    } else if ( ~z.indexOf( 8 ) && z.length === 1 || (~z.indexOf( 8 ) && ~z.indexOf( 9 ) && z.length === 2) ) { // у всех статус 8
        return 8;
    } else if ( ~z.indexOf( 9 ) && z.length === 1 ) {  // у всех статус 9
        return 9;
    } else if ( ~z.indexOf( 3 ) && z.length === 1 ) {
        return 3;
    } else if ( ~z.indexOf( 11 ) && z.length === 1 ) { // у всех статус 11
        return 11
    } else if ( ~z.indexOf( 14 ) && z.length === 1 ) { // стату передлка
        return 14
    } else if ( (~z.indexOf( 15 ) && ~z.indexOf( 16 ) ) && z.length === 2 ) {  // отменён и есть со списанием
        return 15;
    } else if ( ~z.indexOf( 16 ) && z.length === 1 ) {
        return 16
    } else if ( ~z.indexOf( 15 ) && z.length === 1 ) {
        return 15
    } else if ( ~z.indexOf( 4 ) || ~z.indexOf( 5 ) || ~z.indexOf( 6 ) || ~z.indexOf( 7 )
        || ~z.indexOf( 8 ) && z.length > 1 ) { // в работе
        return 4;
    } else if ( ~z.indexOf( 14 ) && z.length > 1 ) {
        return 4
    } else {
        return 2;
    }
};
Order.prototype.statusCounted = function () {
    var i, ii, j, jj, k, kk, z, zz;

    for ( i in this.countedElements ) {
        ii = this.countedElements[i];
        if ( ii.hasOwnProperty( 'child' ) ) {
            ////////--------| for set |----------------------------------------------------------
            zz = [];
            ////////--------| child |----------------------------------------------------------
            var ch = true; // если нет готовищехся елементов отсатётся true
            for ( j in ii.child ) {
                jj = ii.child[j];
                z = [];
                if ( jj.CookingTracker !== 0 ) {
                    ch = false;
                    for ( k in jj.ID_items ) {
                        kk = this.OrderList[jj.ID_items[k]];
                        if ( !kk.hasOwnProperty( 'status' ) ) {
                            kk.status = 2;
                            if ( !~z.indexOf( kk.status ) ) {
                                z.push( 2 );
                                zz.push( 2 );
                            }
                        } else {
                            if ( !~z.indexOf( kk.status ) ) {
                                z.push( kk.status );
                            }
                            if ( !~zz.indexOf( kk.status ) ) {
                                zz.push( kk.status );
                            }
                        }
                    } // конец цикла
                    jj.status = Order.checkStatus( z );
                } else {
                    jj.status = this.status;
                }
                if ( jj.status ) {
                    jj.statusT = STATUS[jj.status]["Name"];
                }
            } // конец цикла
            //--------------\ child |----------------------------------------------------------
            ////////--------| parent |----------------------------------------------------------
            if ( ch ) { // если нет готовищехся елементов
                for ( k in ii.ID_items ) {
                    kk = this.OrderList[ii.ID_items[k]];
                    if ( !kk.hasOwnProperty( 'status' ) ) {
                        kk.status = 2;
                        if ( !~z.indexOf( kk.status ) ) {
                            z.push( 2 );
                            zz.push( 2 );
                        }
                    } else {
                        if ( !~z.indexOf( kk.status ) ) {
                            z.push( kk.status );
                        }
                        if ( !~zz.indexOf( kk.status ) ) {
                            zz.push( kk.status );
                        }
                    }
                } // конец цикла
            }
            ii.status = Order.checkStatus( zz );
            if ( ii.status ) {
                ii.statusT = STATUS[ii.status]["Name"];
            }
            //--------------\ parent |----------------------------------------------------------
            //--------------\ for set |----------------------------------------------------------
        } else if ( Order.except( ii.Price_id ) ) {
            ii.status = 8;
        } else {
            ////////--------| parent |----------------------------------------------------------
            z = [];
            for ( k in ii.ID_items ) {
                kk = this.OrderList[ii.ID_items[k]];
                if ( !kk.hasOwnProperty( 'status' ) ) {
                    kk.status = 2;
                    if ( !~z.indexOf( kk.status ) ) {
                        z.push( 2 )
                    }
                } else {
                    if ( !~z.indexOf( kk.status ) ) {
                        z.push( kk.status )
                    }
                }
            }
            ii.status = Order.checkStatus( z );
            //--------------\ parent |----------------------------------------------------------
        }
        if ( ii.status ) {
            ii.statusT = STATUS[ii.status]["Name"];
        }
    } // конец основного цикла.
};
//------------------------------------------------------------------------------
Order.except = function ( id ) {
    var i, priceID = {
        '679': 'Вилки', '680': 'Палочки для роллов', '682': 'Коробка', '681': "Салфетка бумажная"
    };
    for ( i in priceID ) {
        if ( +i === +id ) {
            return true;
        }
    }
    return false;
};

Order.prototype.updateStatusForDescription = function () {
    var i, ii, j, jj, btn, img, select
        , statusCl = [' status-wait ', ' status-ready ', ' status-prepare ']
        ;

    function cl( item ) {
        if ( item.status == 8 ) {
            return statusCl[1];
        } else if ( item.status == 2 || item.status == undefined ) {
            return statusCl[0];
        } else if ( item.status == 4 ) {
            return statusCl[2];
        }
    }

    this.statusCounted();
    for ( i in this.countedElements ) {
        ii = this.countedElements[i];
        if ( ii.hasOwnProperty( 'child' ) ) {
            document.querySelector( '[data-id="' + this.ID + '"][data-price_id="' + ii.Price_id + '"] ' ).className = ('table-order__spoiler ' + cl( ii ));
            // ставим текст состояния заголовка
            document.querySelector( '[data-id="' + this.ID + '"][data-price_id="' + ii.Price_id + '"] .table-order__status-trekking' ).innerHTML = ii.statusT;

            for ( j in ii.child ) {
                jj = ii.child[j];
                img = ( ((ii.Image.length < 3) || jj.CookingTracker === 0 ) ? '' : '<button data-image="' + jj.Image + '" class="btn-switch-img" data-toggle="modal" data-target="#show-img" type="button"></button>');
                btn = ( ((jj.status === 9 || jj.status === 8) && jj.CookingTracker !== 0) ? '<button class="btn-refresh" data-toggle="modal" data-target="#remake" type="button"></button>' : '');
                // ставим текст состояния заголовка
                select = '[data-id_items="' + jj.ID_items + '"][data-id_parent="' + ii.Price_id + '"][data-id="' + this.ID + '"][data-price_id="' + jj.Price_id + '"] ';
                $( select ).removeClass();
                $( select + '.table-order__status-trekking' ).html( (jj.CookingTracker == 0 ? '' : jj.statusT) );
                $( select + '.table-order__img-product' ).html( img );
                $( select + '.table-order__refresh' ).html( btn );
            }
        } else {
            img = (ii.Image.length < 3 ? '' : '<button data-image="' + ii.Image + '" class="btn-switch-img" data-toggle="modal" data-target="#show-img" type="button"></button>');
            btn = ( ((ii.status === 9 || ii.status === 8) && ii.CookingTracker !== 0 ) ? '<button class="btn-refresh" data-toggle="modal" data-target="#remake" type="button"></button>' : '');


            select = '[data-id="' + this.ID + '"][data-price_id="' + ii.Price_id + '"] ';

            $( select ).removeClass().addClass( 'table-order__no-spoiler ' + cl( ii ) );
            // ставим текст состояния заголовка
            $( select + ' .table-order__status-trekking' ).html( (ii.CookingTracker == 0 ? '' : ii.statusT) );
            $( select + '.table-order__img-product' ).html( img );
            $( select + '.table-order__refresh' ).html( btn );
        }
    }
    Order.check();
};

Order.prototype.makeDescriptionElement = function () {
    var finElem = [], mainElem, headElem
        , decorateElem1 = '<tr class="table-order__spoiler-content"><td colspan="6"><table class="table-order inner-table">'
        , decorateElem2 = '</table></td></tr>'
        , data, st, i, ii, j, jj, count = 0
        ;

    this.countElements();

    for ( i in this.countedElements ) {
        ii = this.countedElements[i];
        count++;

        if ( ii.hasOwnProperty( 'child' ) ) {
            data = ' data-id="' + this.ID + '" data-price_id="' + ii.Price_id + '" ';

            headElem = '<tr ' + data + ' class="table-order__spoiler">\
                <td class="table-order__order-number" style="padding-left: 15px">#' + this.ID + '-' + count + '</td>\
                <td class="table-order__menu-name">' + ii.PriceName + ' x' + ii.count + '\
                    <button  class="btn-switch-spoiler" type="button">- \
                        <span class="arr-up"></span>\
                    </button>\
                </td>\
                <td class="table-order__status-trekking">ii.statusT</td>\
                <td class="table-order__time"><!--20:00--></td>\
                <td class="table-order__img-product"></td>\
                <td class="table-order__refresh"></td>\
            </tr>';
            finElem.push( headElem );
            finElem.push( decorateElem1 );
            for ( j in ii.child ) {
                count++;
                jj = ii.child[j];
                data = ' data-id_items="' + jj.ID_items + '" data-id_parent="' + ii.Price_id + '" data-id="' + this.ID + '" data-price_id="' + jj.Price_id + '" ';
                st = ( jj.CookingTracker == 0 ? '' : jj.statusT);

                mainElem = '<tr ' + data + '><td class="table-order__order-number" style="padding-left: 15px">#' + this.ID + '-' + count + '</td>\
                        <td class="table-order__menu-name">' + jj.PriceName + ' x' + jj.count + '</td>\
                        <td class="table-order__status-trekking"> + st + </td>\
                        <td class="table-order__time"><!--0:00--></td><td class="table-order__img-product">\
                    + img + </td><td class="table-order__refresh"> + btn + </td></tr>';
                finElem.push( mainElem );
            }
            finElem.push( decorateElem2 );

        } else {
            data = ' data-id_items="' + ii.ID_items + '" data-id="' + this.ID + '" data-price_id="' + ii.Price_id + '" ';

            finElem.push( '<tr ' + data + ' ><td class="table-order__no-spoiler" style="padding-left: 15px">#' + this.ID + '-' + count + '</td>\
                <td class="table-order__menu-name">' + ii.PriceName + ' x' + ii.count + '</td>\
                <td class="table-order__status-trekking">' + ii.statusT + '</td>\
                <td class="table-order__time"><!--0:00--></td>\
                <td class="table-order__img-product"> + img + </td>\
                <td class="table-order__refresh"> + btn + </td>\
                </tr>' );
        }
    }
    document.getElementById( 'table_order' ).innerHTML = finElem.join( '' );
    this.updateStatusForDescription();
};


Order.prototype.calcPayment = function () {
    // console.group( 'calcPayment' );
    var i, ii, valueCard = 0, valueCash = 0, valueBonus = 0, payment, motPayment;
    for ( i in this.payments ) {
        ii = this.payments[i];
        // console.log( 'ii', ii );
        switch ( ii.TypePayments ) {
            case 1 :
                valueCash += +ii.Deposit;
                break;
            case 2 :
                valueCard += +ii.Deposit;
                break;
            case BONUS :
                valueBonus += +ii.Deposit;
                break;
        }
    }
    payment = valueCard + valueCash + valueBonus;
    motPayment = this.PriceWithDiscount - payment;
    this.notPayment = motPayment;

    if ( motPayment <= 0 || this.Division !== ' ' ) { // оплаченно ли
        document.getElementById( 'payment_over' ).classList.remove( 'red_txt' );
        document.getElementById( 'payment_over' ).innerHTML = 'Оплачено';
        // $( '#pay_order' ).attr( 'disabled', true ).addClass( 'disabled' );
    } else {
        document.getElementById( 'payment_over' ).classList.add( 'red_txt' );
        document.getElementById( 'payment_over' ).innerHTML = 'Не оплачено';
        // $( '#pay_order' ).attr( 'disabled', false ).removeClass( 'disabled' );
    }
    document.getElementById( 'price' ).innerHTML = this.Price;
    document.getElementById( 'discount' ).innerHTML = this.DiscountPercent + '%';
    document.getElementById( 'cards' ).innerHTML = valueCard;
    document.getElementById( 'cashs' ).innerHTML = valueCash;
    document.getElementById( 'bonuses' ).innerHTML = valueBonus;
    document.getElementById( 'price_with_discount' ).innerHTML = motPayment;
    document.getElementById( 'payment_met' ).innerHTML = (this.TypePayments == 1 ? CASH : CARD);

    // console.log( 'pay', payment, motPayment, valueCard, valueCash, valueBonus );
    // console.groupEnd();
};
Order.prototype.address = function () {
    var address =
            (this.Custumer.City === ' ' ? '' : 'н.п. ' + this.Custumer.City)
            + (this.Custumer.Street === ' ' ? '' : ' ул. ' + this.Custumer.Street)
            + (this.Custumer.House === 0 ? '' : ' д.' + this.Custumer.House)
            + (this.Custumer.Building === ' ' ? '' : ' ст.' + this.Custumer.Building)
            + (this.Custumer.Apartment === 0 ? '' : ' кв.' + this.Custumer.Apartment)
            + (this.Custumer.Entrance === 0 ? '' : ' п.' + this.Custumer.Entrance)
            + (this.Custumer.Floor === 0 ? '' : ' эт.' + this.Custumer.Floor)
            + (this.Custumer.DoorphoneCode === ' ' || this.Custumer.DoorphoneCode === '0' ? '' : ' домофон:' + this.Custumer.DoorphoneCode)
        ;
    return address;
};

Order.prototype.showDescription = function () { // для отображения нужно вызывать MSG.request.orderLists(ID)
    document.title = "Заказ #" + this.ID;
    $( '#ready_order' ).attr( 'disabled', true ).addClass( 'btn-order-ready__disabled' );
    document.getElementById( 'pay_order' ).dataset.id_order = this.ID;
    this.makeDescriptionElement();
    Page.show.DescriptionOrder();

    document.getElementById( 'order_ID' ).innerHTML = '#' + this.ID;
    document.getElementById( 'name_customer' ).innerHTML = this.NameCustomer || NO_NAME + '.';
    document.getElementById( 'order_type' ).innerHTML = this.Type.slice( 0, 1 ) + this.Type.slice( 1 );

    var note = Page.timeReplace( this.Order_time ).split( ' ' )[1].slice( 0, 5 );
    if ( this.TimeDelivery !== EMPTY_TIME ) {
        note += ' / ' + Page.timeReplace( this.TimeDelivery ).slice( 0, -4 );
    }
    note += '<br>';
    if ( this.Division != ' ' ) {
        note += 'Обед для: ' + this.Division + '<br>'
    }
    note += 'Количество персон: ' + this.CountPerson + '<br>' + this.Note;
    document.getElementById( 'note' ).innerHTML = note || '--';
    this.calcPayment();
    var ad = '';
    if ( this.Custumer ) {
        ad = this.address();
        ad = (ad == '' ? '' : ad + ' <br> ')
            + (this.Custumer.Phone === '' ? '' : 'Тел.' + this.Custumer.Phone );
    }
    document.getElementById( 'address' ).innerHTML = ad;
    Order.check();
};

////////--------| Модалки и кнопки |----------------------------------------------------------


////////--------| REMAKE |----------------------------------------------------------
$( document ).on( 'click', '[data-target="#remake"]', function () {
    var elem = $( this ).parent().parent()
        , ID_items = elem.attr( 'data-id_items' )
        , ID = elem.attr( 'data-id' )
        ;
    console.log( 'ID, ID_items, elem', ID, ID_items, elem );
    document.getElementById( 'modal_price_name' ).innerHTML = Order.list[ID].OrderList[ID_items[0]].PriceName;
    document.getElementById( 'btn_remake' ).dataset.id_items = ID_items;
    document.getElementById( 'btn_remake' ).dataset.id = ID;
} );
$( document ).on( 'click', '#btn_remake', function () {
    var count = +document.getElementById( 'element_remake_count' ).value
        , ID_items = document.getElementById( 'btn_remake' ).dataset.id_items.split( ',' )
        , ID = document.getElementById( 'btn_remake' ).dataset.id
        , i
        ;
    console.log( 'count, ID_items, ID', count, ID_items, ID );
    if ( count < 1 ) {
        return
    }
    for ( i = 0; i < count; i++ ) {
        MSG.set.status( ID, ID_items[i], 14 );
    }
} );
//--------------\ REMAKE |----------------------------------------------------------

////////--------| CANCEL ORDER |----------------------------------------------------------
// !!! для всего заказа ставим отменён без списания.
$( document ).on( 'click', '#btn_cancel_order', function () {
    var ord = Order.list[document.getElementById( 'span_cancel_order' ).innerHTML];
    if ( ord.status < 11 || !ord.status ) {
        MSG.set.status( ord.ID, 0, 16 );
    }
} );
$( document ).on( 'click', '#cancel_order', function () {
    document.getElementById( 'span_cancel_order' ).innerHTML = document.title.split( '#' )[1];
} );
//--------------\ CANCEL ORDER |----------------------------------------------------------

// TODO: подсчёт не отмеченных елементов
//--------------\ Модалки и кнопки |----------------------------------------------------------

$( document ).on( 'click', '#home_description_order', function () {
    document.getElementById( 'description_order' ).style.display = 'none';
    document.getElementById( 'cassir' ).style.display = '';
    document.title = 'Заказы';
} );