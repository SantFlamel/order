// TODO: минимальная сумма заказа 300р.
// TODO: V уменьшить шрифт каталог.!!!
// TODO: V пустота меж кнопками.
// TODO: Сортировка по имени продукта.

var LIMIT_IN_CART=500,
    DISCOUNT_FREE_SOUSES = 'Бесплатный соус для пиццы.';
var FREE_SOUSES_FOR_PIZZA = [87];
var NO_NAME = 'Без имени'
    , DELIVERY = 'Доставка'
    , TAKEAWAY = 'Навынос'

    // Типы оплаты
    , CARD = 'Картой'
    , CASH = 'Наличными'
    , BONUS = 'Бонусами'
    // Типы действий
    , WITHDRAWAL = 'withdrawal' // изятие
    , DEPOSIT = 'deposit' // внесение
    , PAYMENT = 'payment' // оплата
    ;

function Cart() {
}

function Product( data ) {//TODO не работало как у Дениса, приходится использовать старую версию, надо проверять
    if ( !(this instanceof Product) ) {
        return new Product( data );
    }
    var i;
    this.Type_id = data.Type_id;
    this.added = data.added;
   // this.id = data.id;
    this.Price_id = data.Price_id;
    this.name = data.name;
    this.PriceName = data.PriceName;
    this.mass = data.mass;
    this.Price = data.Price;
    this.price = data.Price;
    this.description = data.Composition;
    this.Composition = data.Composition;
    this.description_added = data.Additionally;
    this.Additionally = data.Additionally;
    this.pack_info = data.Packaging;
    this.Packaging = data.Packaging;
    this.addeds = data.addeds;
    this.defaultCount = data.defaultCount || 0;
    this.CookingTracker = data.CookingTracker;
    this.Image = data.Image;
    this.Set = data.Set;
    this.TimeCook = data.TimeCook;
    this.TimeFry = data.TimeFry;
    this.ProductHash  = data.ProductHash ;
    this.Units=data.Units;
    this.Value=data.Value;

    // if ( !this.added ) {
    //     console.log('if ( !this.added ) {', this.added);
    //     this.makeCatalogElement();
    // }

   // this.added = Order.except(data.Price_id);
    this.mass = this.Value + ' ' + this.Units;

    this.CookingTracker = data.CookingTracker || 0;
    if ( data.Type_id == 12 || data.Type_id == 13 || data.Type_id == 14 || data.Type_id == 15 ) {
        this.addeds = [679, 680];
    }
    Product.list[this.Price_id] = this;
    this.showCatalogElements();
}
Product.list = {};
//// каталог-------------------------------------------------------------------------
Product.prototype.makeCatalogElement = function () {
    // через this.dataset.price_id не работает.
    this.catalogElement =
        '<li data-id="' + this.Price_id + '" data-hash="' + this.ProductHash + '" onclick="if ( !this.classList.contains(\'stop_list_product\') )   {Product.list[' + this.Price_id + '].showDescription()}"><a>' +
        this.PriceName + ' ' + this.Price + 'р.</a></li>'
};

Product.prototype.showCatalogElements = function () {
    this.makeCatalogElement();
    switch ( this.Type_id ) {
        case 14: {
            $( '#sets .product_group' ).append( this.catalogElement );
            break;
        }
        case 13: {
            $( '#rols .product_group' ).append( this.catalogElement );
            break;
        }
        case 15: {
            $( '#zrols .product_group' ).append( this.catalogElement );
            break;
        }
        case 12: {
            $( '#sushi .product_group' ).append( this.catalogElement );
            break;
        }
        case 5: {
            if ( ~this.PriceName.indexOf( '25' ) ) { // маленькая пица
                $( '#pizza_small .product_group' ).append( this.catalogElement );
            } else if ( ~this.PriceName.indexOf( ',30' ) ) { // средняя
                if ( ~this.PriceName.indexOf( '(т)' ) ) { // толстая
                    $( '#pizza_big_t .product_group' ).append( this.catalogElement );
                } else { // тонкая
                    $( '#pizza_big_tr .product_group' ).append( this.catalogElement );
                }
            } else { // остальное // сеты
                $( '#pizza>.product_group' ).append( this.catalogElement );
            }
            break;
        }
        case 9: {
            $( '#sous .product_group' ).append( this.catalogElement );
            break;
        }
        case 10: // так и должно быть
        case 11: {
            $( '#salat .product_group' ).append( this.catalogElement );
            break;
        }
        case 16: // так и должно быть
        case 17: {
            $( '#drink .product_group' ).append( this.catalogElement );
            break;
        }
        default:
            $( '#other .product_group' ).append( this.catalogElement );
            break;
    }
    delete this.catalogElement;
};

Cart.showCatalog = function () {
    document.title = "Корзина";
    $( '#products_cat' ).css( 'display', '' );
    $( '#description' ).css( 'display', 'none' );
};


Product.prototype.makeBtnPlusMinusElement = function ( id, val ) {
    // this - основной обект, id его же или id доп. продукта.
    if ( Cart.cartCount.hasOwnProperty( this.Price_id ) ) {
        if ( this.Price_id === id ) {
            val = Cart.cartCount[this.Price_id].count;
        } else {
            val = Cart.cartCount[this.Price_id][id].count
        }
    } else {
        val = 0
    }
    // если продукт дополнительный то id - собственный айди,  this.Price_id - оснойвной продукт
    //  для input выполняется проверка на NaN, и по не обходимости выставляется предидущее значение.
    return '<button onclick="Product.setCountCart('
        + this.Price_id + ', ' + id + ' , -1, \'minus\')" class="minus">-</button>' + '<input onkeyup="' +
        'if (+this.value > LIMIT_IN_CART){this.value = LIMIT_IN_CART} ' +
        'Product.setCountCart(' + this.Price_id + ', ' + id + ', this.value, \'input\')" class="input'
        + this.Price_id + '_' + id + ' limit500 number" type="text" placeholder="0" value="' + val + '">' + '<button onclick="Product.setCountCart('
        + this.Price_id + ', ' + id + ', +1, \'plus\')" class="plus">+</button>';
};

Product.prototype.updateInputVal = function ( id, val, ad ) {
    ad = ad || '';
    // если продукт основной то id собственное и равно this.Price_id
    $( '.input' + this.Price_id + '_' + id ).val( val );
    if ( this.Price_id == id ) {
        $( '.span' + this.Price_id ).html( ad + val );
    } else {
        $( '.span' + this.Price_id + '_' + id ).html( val );
    }
};

Product.prototype.makeDescriptionElement = function () {
    // делаем описание >
    var x = '', _elem;
    if ( ~FREE_SOUSES_FOR_PIZZA.indexOf( this.Price_id ) ) {
        x = ' </br> <div style="margin-top: 15px"><input style="width: 12px" id="sous_for_pizza" type="checkbox"><label for="sous_for_pizza">Бесплатный соус к пицце</label></div>'
    }
    _elem = '<div class="div'
        + this.Price_id + '"><p class="h3">'
        + this.PriceName + ', ' + this.mass + '.<span class="font_blue">'
        + this.Price + 'руб.</span></p><p class="h4">Состав</p><p class="desc">'
        + this.Composition + '</p><p class="h4">Дополнительно</p><p class="desc">'
        + this.Additionally + '</p><p class="h4">Упаковка</p><p class="desc">'
        + this.Packaging + '</p><p class="h4">Добавьте продукт в корзину</p></div><div class="chuse-count">' +
        this.makeBtnPlusMinusElement( this.Price_id ) + x + '</div>';
    // добавляем выбор доп. приборов.
    // for ( var i in this.addeds ) {
    //     i = Product.list[this.addeds[i]]; // !!!!!!!!!!!!!!!!
    //     _elem += '<p class="h4">Количество бесплатных приборов ('
    //         + i.name + ')'
    //         + '  <span id="' + this.Price_id + '" class="count span' + this.Price_id + '_' + i.id + '" style="color: #0076ff;">0</span>' // TEST LINE(S) ////////////////////////
    //         + '<!--<div class="chuse-count">--></p>' // TEST LINE(S) ////////////////////////
    //         /*+ this.makeBtnPlusMinusElement( i.id )*/ + '</div>'; // TEST LINE(S) ////////////////////////
    // }
    _elem += '<a onclick="Cart.showCatalog()" class="green_button col-sm-1" style="text-align: center">OK</a>';
    // + '<a onclick="Cart.showCatalog()" class="red_button col-sm-1" style="text-align: center;padding: 5px 1px;">Отмена</a>'; // TEST LINE(S) ////////////////////////
    this.descriptionElement = _elem;
};
Product.prototype.showDescription = function () {
    document.title = this.PriceName;
    this.makeDescriptionElement();
    var des = document.getElementById( 'description' );
    des.innerHTML = this.descriptionElement;
    document.getElementById( 'products_cat' ).style.display = 'none';
    des.style.display = '';
    delete this.descriptionElement;
};

Product.prototype.makeCartListElement = function () {
    // this всегда основной обект.
    var c = Cart.getCart(), count = this.added ? 0 : c[Cart.findID( this.Price_id, c )[0]].count;
    this.btn = function () {
        var x = '<div class="panel-body">' + this.makeBtnPlusMinusElement( this.Price_id ) + '</div>';
        // for ( var i in this.addeds ) {  //TEST////////////////////////
        //     x += '<a>&emsp;&mdash;' + Product.list[this.addeds[i]].name
        //         + '<span id="' + this.Price_id + '" class="count span' + this.Price_id + '" style="color: #0076ff; padding-right: 65%"></span>' + // TEST LINE ////////////////////////
        //         '</a>' + '<div class="panel-body">' +
        //         this.makeBtnPlusMinusElement( this.addeds[i] ) + '</div>';
        // }
        return x;
    };
    if ( !this.hasOwnProperty( 'cartListElement' ) ) {
        this.cartListElement =
            '<div class="cart_div_' + this.Price_id + ' product_in_cart"><div class="panel-heading" role="tab" id="' +
            this.Price_id + 1 + '"><a data-toggle="collapse" data-parent="#accordion" href="#' + this.Price_id + 2 +
            '" aria-expanded="false" aria-controls="' + this.Price_id + 2 + '">' + this.PriceName + '<span id="' +
            this.Price_id + '" class="count span' + this.Price_id + '">' + this.Price + 'р. х ' + count +
            '</span></a></div><div id="' + this.Price_id + 2 +
            '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="' + this.Price_id + 1 + '">' +
            this.btn() + '</div></div>';
    }
};
Product.prototype.addCartListElement = function () {
    this.makeCartListElement( this.Price_id );
    if ( $( '.cart_div_' + this.Price_id ).length == 0 ) {
        $( '#cart_list' ).append( this.cartListElement );
    }
    delete this.cartListElement;
};
Product.prototype.deleteFromCart = function ( f ) {
    if ( this.added && !f ) {
        return;
    }
    $( '.cart_div_' + this.Price_id ).remove();
    Cart.showCatalog();
};

////////--------| CART |----------------------------------------------------------
/* TODO: сделать корзину в виде cart{10:[ {id: 10, ...}, {id: 10, ...}, ...], 12:[ {id: 12, ...}, ...], ...} */
Cart.list = [];
Cart.cartCount = {};

Cart.findID = function () {
    var find, i;
    return function ( id, arr ) {
        find = [];
        for ( i in arr ) if ( arr[i].Price_id === id ) {
            find.push( i );
        }
        return find;
    }
}(); // САМОИСПОЛНЯЮЩАЯСЯ!!!!!!!!!!!!!!!!!
Cart.findAddeds = function ( parent_id, arr ) {
    var i, x;
    arr = arr || Cart.list;
    for ( i in arr ) {
        x = arr[i]; //!!!!!!!!!!!!!!!!!!!!!!!
        if ( i.parent_id === parent_id && i.Price_id !== i.parent_id ) {
            return i;
        }
    }
};

Cart.copyObj = function ( obj ) {
    var x = {}, i;
    for ( i in obj ) {
        x[i] = obj[i]
    }
    return x
};

Product.setCountCart = function ( mainID, id, val ) {
    // console.group( 'setCountCart' );
    if ( val > LIMIT_IN_CART ) {
        return;
    }
    var self = Product.list[id], i;
    switch ( val ) {
        case 1:
            // console.group( 's inc' );
            Cart.inc( self );
            // console.groupEnd();
            break;
        case -1:
            // console.group( 's dec' );
            Cart.dec( self );
            // console.groupEnd();
            break;
        default:
            // console.group( 's set', val );
            if ( val ) {
                var qu = Cart.findID( id, Cart.list ).length, odds = +val - qu;
                // console.log( 'val, qu, odds', val, qu , odds );
                if ( odds < 0 ) {
                    odds *= -1;
                    // console.time( 'Cycle' );
                    for ( i = 0; i < odds; i++ ) {
                        Cart.dec( self );
                    }
                    // console.timeEnd( 'Cycle' );
                } else if ( odds > 0 ) {
                    for ( i = 0; i < odds; i++ ) {
                        Cart.inc( self );
                    }
                } else {
                    return;
                }
            }
            // console.groupEnd();
            break;
    }

    Cart.showPrice();
    Cart.getCartCount();
    Product.list[mainID].updateCunt();
    Product.list[id].updateCunt();
    // console.groupEnd();
};


Cart.inc = function ( self ) {
    var prod = {
        Price_id: self.Price_id, Price: self.Price, DiscountName: self.DiscountName || null,
        DiscountPercent: self.DiscountPercent || 0, PriceName: self.PriceName, count: 1
        , Type_id: self.Type_id
    };
    if ( Promotion.hasOwnProperty( '_selectDiscount' ) ) {
        if ( Promotion._selectDiscount.hasOwnProperty( 'DiscountPercent' ) ) {
            prod.DiscountPercent = Promotion._selectDiscount.DiscountPercent;
            prod.DiscountName = Promotion._selectDiscount.DiscountName;
            prod.IDPresent = Promotion._selectDiscount.IDPresent;
            prod.ID = Promotion._selectDiscount.ID;

        }
    }
    // if ( self.addeds.length !== 0 ) {
    //     for ( var i in self.addeds ) {
    //         i = self.addeds[i]; //!!!!!!!!!!!!!!!!!!!!!!!
    //         // console.log( 'function "Cart.add" Product.list[i].name =', Product.list[i].name );
    //         c = 0;
    //         while ( c < (self.defaultCount || 1) ) {
    //             Cart.list.push( {
    //                 id: i
    //                 , price: Product.list[i].price
    //                 , DiscountName: 'к набору'
    //                 , DiscountPercent: 100
    //                 , name: Product.list[i].name
    //                 , count: 1
    //                 , parent_id: self.id
    //             } );
    //             c++
    //         }
    //     }
    // }
    Promotion._selectDiscount = Cart.list.push( prod ) - 1;
};
Cart.dec = function ( self ) {
    var elemList = Cart.findID( self.Price_id, Cart.list ), list = {
        elem: {}, DiscountPercent: 'no', index: 'no'
    }, elem, elemCart, len, c;
    for ( elem in elemList ) {
        elemCart = Cart.list[elemList[elem]]; //!!!!!!!!!!!!!!!!!!!!!!!!!{
        if ( (elemCart.DiscountPercent < list.DiscountPercent || list.index === 'no') &&
            (elemCart.DiscountName !== 'к набору' ||
            elemList.length > Cart.findID( elemCart.parent_id, Cart.list ).length ) ) {
            list.elem = elemCart;
            list.DiscountPercent = elemCart.DiscountPercent;
            list.index = elemList[elem]
        }
    }
    if ( list.index !== 'no' ) {
        Cart.list.splice( list.index, 1 );
    }
    // if ( self.addeds.length !== 0 ) {
    //     // console.log('HAVE LENGTH');
    //     for ( elem in self.addeds ) {
    //         c = 0;
    //         while ( c < (self.defaultCount || 1) ) {
    //             Cart.list.splice( Cart.findAddeds( self.id ), 1 );
    //             c++
    //         }
    //     }
    // }
    // console.groupEnd();
};

Cart.getCartCount = function () {
    var cart = {}, i;
    for ( i in Cart.list ) {
        i = Cart.list[i]; //!!!!!!!!!!!!!!!!!!
        if ( i.hasOwnProperty( 'parent_id' ) ) {
            if ( cart.hasOwnProperty( i.parent_id ) ) {
                if ( cart[i.parent_id].hasOwnProperty( i.Price_id ) ) {
                    cart[i.parent_id][i.Price_id].count += 1;
                } else {
                    cart[i.parent_id][i.Price_id] = { count: 1 };
                }
            } else {
                cart[i.parent_id] = { count: 0 };
                cart[i.parent_id][i.Price_id] = { count: 1 };
            }
        } else {
            if ( cart.hasOwnProperty( i.Price_id ) ) {
                cart[i.Price_id].count += 1;
            } else {
                cart[i.Price_id] = { count: 1 };
            }
        }
    }
    Cart.cartCount = cart;
};
Cart.getType = function () {
    // Доставка, Навынос
    return $( ".delivery_met.active a" ).html();
};
Cart.getCart = function () {
    var cart = [], i, ii, x, exist;
    for ( i in Cart.list ) {
        i = Cart.copyObj( Cart.list[i] );
        exist = Cart.findID( i.Price_id, cart );
        if ( exist.length !== 0 ) {
            for ( ii in exist ) {
                x = true;
                ii = cart[exist[ii]]; //!!!!!!!!!!!!!!!!!!!!!!!!
                if ( ii.DiscountName === i.DiscountName ) {
                    ii.count += 1;
                    x = false;
                    break;
                }
            }
            if ( x ) {
                cart.push( Cart.copyObj( i ) );
            }
        } else {
            cart.push( Cart.copyObj( i ) );
        }
    }
    return cart;
};


Cart.getPrice = function () {
    // console.group( 'Cart.getPrice ' );
    var price1, price = 0, i, discount = ' ', discountPercent = 0, cart = Cart.getCart();
    for ( i in cart ) if ( cart.hasOwnProperty( i ) ) {
        i = cart[i]; //!!!!!!!!!!!!!!!!!!!!!!!!
        price += i.count * (i.Price - (i.DiscountPercent / 100 * i.Price));
    }

    price1 = price;
    if ( !$( '#to_workers' ).prop( 'checked' ) ) {
        if ( Promotion.selectDiscount ) {
            discount = Promotion.selectDiscount.Name;
            discountPercent = Promotion.selectDiscount.Value;
            price1 = price - price * (discountPercent / 100);
        }
    }
    // console.log('price', price, discount, discountPercent );
    // console.groupEnd();
    return [Math.floor( price ), discount, discountPercent, Math.floor( price1 )];
};
Cart.showPrice = function () {
    var p = Cart.getPrice();
    $( '.over_price' ).html( p[0] + ' p.' );
    $( '.over_price_without' ).html( p[3] + ' p.' );
};

Product.prototype.updateCunt = function () {
    // console.group( 'updateCunt' );

        Cart.getCartCount();
    var del = false, add = false;
    if ( Cart.cartCount.hasOwnProperty( this.Price_id ) ) {
        this.updateInputVal( this.Price_id, Cart.cartCount[this.Price_id].count, this.Price + 'р. x ' );
        add = true;
        // for ( i in this.addeds ) {
        //     ii = Product.list[this.addeds[i]]; // !!!!!!!!!!!!!!!!!
        //     if ( Cart.cartCount[this.Price_id].hasOwnProperty( ii.Price_id ) ) {
        //         this.updateInputVal( ii.Price_id, Cart.cartCount[this.Price_id][ii.Price_id].count );
        //         add = true;
        //     } else {
        //         this.updateInputVal( ii.Price_id, 0 );
        //         del = true
        //     }
        // }
    } else {
        this.updateInputVal( this.Price_id, 0, this.Price + 'р. x ' );
        del = true
    }
    if ( add ) {
        // console.log( 'if ( add ) ' );
        this.addCartListElement();
        // for ( var i in this.addeds ) {
        //     i = Product.list[this.addeds[i]]; // !!!!!!!!!!!!!!!!!
        //     i.addCartListElement();
        // }
    } else if ( del ) {
        // console.log( 'else if ( del )' );
        this.deleteFromCart();
        // for ( var i in this.addeds ) {
        //     i = Product.list[this.addeds[i]]; // !!!!!!!!!!!!!!!!!
        //     i.deleteFromCart( true );
        // }
    }
    // console.groupEnd()
};

Cart.clean = function () {
    Cart.list = []; // очищаем корзину
    Cart.cartCount = {}
};
Cart.cancelOrder = function () {
        Promotion.runAll();
    Cart.clean();
    $( '.product_in_cart' ).remove(); // очищаем боковую панель
    Cart.showPrice(); // сбрасыываем ценник
};


//--------------\ CART |----------------------------------------------------------
$( '#products_cat li' ).click( function () {
    $( '#products_cat li' ).removeClass( 'active' )
} );
//TODO отличается от Дениса
$( document ).on( "click", ".delivery_met", function () {
    // пересчёт стоимости при смене способа доставки
    var h = this.childNodes[0].hash, i;
    $( '.delivery_met' ).removeClass( 'active' );
    $( '.delivery_met [href = "' + h + '"]' ).parent().addClass( 'active' );
    Cart.showPrice();
    $( '#take_away_address').prop('selectedIndex', -1);

    if  ($( '.delivery_met.active a' ).html() === 'Навынос') {
        for (var i = 0; i < Organizations.length; i++)
            $('#take_away_address option[value=' + i + ']').removeAttr('disabled');// активируем адреса
        $("#warning_dellivery").css( "color", "green" );
        $("#warning_dellivery").html("Выберите точку");
        $(".delivery_name").html("приготовлен");
    }
    else {

        $(".delivery_name").html("доставлен");
        getDeliveryZone(
        $("#city_client").val(),
        $(".operator_client_adress .collapse.in #street_client").val(),
        $(".operator_client_adress .collapse.in #home_number").val());
    }
} );

$( '#promo_discount' ).change( function () {
    Cart.showPrice()
} );

$( document ).ready( function () {
    $( '#product_search' ).keyup( function ( e ) {
        var code = e.keyCode || e.which;
        if ( code == '9' ) return;
        var $Items = $( ".tab-pane .product_group li a:not(.part)" ), $input = $( this ), inputContent = $input.val()
            .toLowerCase();
        var $filterItems = $Items.filter( function () {
            var value = $( this ).text().toLowerCase();
            if ( value.indexOf( inputContent ) === -1 ) return true;
        } );
        //отображает все строки,  скрывает отфтльтрованные
        $Items.parent().show();
        $filterItems.parent().hide();
    } );
} );

$( document ).on( 'click', '.cart_btn_cancel', function () {
    Cart.cancelOrder()
} );

//////// для теста-------------------------------------------------------------------------
// cartwien = function () { //TEST
//     console.log( '\nCart' );
//     for ( var i in  Cart.list  ) {
//         console.log( '\t', Cart.Products[i].name, Cart.list [i].count );
//         for ( var i1 in Cart.list [i] ) {
//             if ( i1 !== 'count' ) {
//                 console.log( '\t\t', i, Cart.Products[i1].name, Cart.list [i][i1].count, '\n' )
//             }
//         }
//     }
// };

Cart.addProduct = function ( prod ) { //TEST
    //Product.list[prod['id']] =
        new Product( prod );
};

// for ( var i in products ) { //TEST
//     Cart.addProduct( products[i] );
//     if ( !products[i].added ) {
//         Cart.Products[i].showCatalogElements();
//     }
// }


var counter = function ( x ) {
    var count = 0;
    return function () {
        console.log( x || '', 'Count :', count++ )
    }
};
var xxx = counter( 'getPrice' );

// Cart.getCart(); //TEST


