// Order = {
//     name: 'Ролл "Филадельфия"',
//     number: 1
// };
//
// var mainElement = '<tr class="table-order__spoiler status-ready"><td class="table-order__order-number">#'
//     + number + '23-1</td><td class="table-order__menu-name">'
//     + name + 'Ролл "Филадельфия"\
//         <button class="btn-switch-spoiler" type="button">'
//     + count + '5<span class="arr-up"></span></button>\
//         </td><td class="table-order__status-trekking">Готово!</td><td class="table-order__time doc_time">'
//     + '20:00</td><td class="table-order__img-product"></td>\
//         <td class="table-order__refresh"></td></tr><tr class="table-order__spoiler-content"><td colspan="6"><table class="table-order inner-table"><tr><td class="table-order__order-number">#'
//     + number + '23-1</td><td class="table-order__menu-name">'
//     + name + 'Ролл &laquo;Филадельфия&raquo;</td><td class="table-order__status-trekking">Готово!</td>\
//         <td class="table-order__time">0:00</td><td class="table-order__img-product">\
//         <button class="btn-switch-img" data-toggle="modal" data-target="#show-img" type="button"></button>\
//         </td><td class="table-order__refresh"><button class="btn-refresh" data-toggle="modal" data-target="#rework" type="button"> </button> </td> </tr>'
//     + addedElement + '</table></td></tr>';
// var addedElement = '<tr><td class="table-order__order-number">#'
//     + number + '23-1</td><td class="table-order__menu-name">'
//     + name + 'Имбирь ' + count + ' х15 г</td><td class="table-order__status-trekking"></td><td class="table-order__time"></td><td class="table-order__img-product"></td><td class="table-order__refresh"></td></tr>';

// function makeElementOfOrders() {
//
// }
//
// function descrOrder() {
//
// }

/* нужно определить что за время <td class="table-order__time">1:35</td> */
// прикрутить картинку модалку.


// делаем доп. обекты для каждого пункта заказа:
//   имена продуктов;
//   масса продуктов или количество
//   линк на картинку
//

var addedElement = '<tr><td class="table-order__order-number">#'
    + '23-1</td><td class="table-order__menu-name">'
    + ' ' + 'Имбирь х15 г</td><td class="table-order__status-trekking"></td><td class="table-order__time"></td><td class="table-order__img-product"></td><td class="table-order__refresh"></td></tr>';


var mainElement = '<tr data-id="1234" class="table-order__spoiler status-ready"><td class="table-order__order-number">#'
    + '23-1</td><td class="table-order__menu-name">'
    + 'Ролл "Филадельфия"\
        <button class="btn-switch-spoiler" type="button">'
    + '5\n<span class="arr-up"></span></button>\
        </td><td class="table-order__status-trekking">Готово!</td><td class="table-order__time doc_time">'
    + '20:00</td><td class="table-order__img-product"></td>\
        <td class="table-order__refresh"></td></tr><tr class="table-order__spoiler-content"><td colspan="6"><table class="table-order inner-table"><tr><td class="table-order__order-number">#'
    + '23-1</td><td class="table-order__menu-name">'
    + 'Ролл &laquo;Филадельфия&raquo;</td><td class="table-order__status-trekking">Готово!</td>\
        <td class="table-order__time">0:00</td><td class="table-order__img-product">\
        <button class="btn-switch-img" data-toggle="modal" data-target="#show-img" type="button"></button>\
        </td><td class="table-order__refresh"><button class="btn-refresh" data-toggle="modal" data-target="#rework" type="button"> </button> </td> </tr>'
    + addedElement + '</table></td></tr>';

$( '#table_order' ).append( mainElement );


Order.prototype.makeDescriptionOrderElement = function () {
    var index = 0;
    this.subProductElement = function ( ID_item ) {
        var x = '';
        for ( var elem in [] ) {
            x += '<tr><td class="table-order__order-number">#'
                + this.ID + '' + index + '</td><td class="table-order__menu-name">'
                + 'Имбирь ' + ' х15 г' + '</td><td class="table-order__status-trekking"></td><td class="table-order__time"></td><td class="table-order__img-product"></td><td class="table-order__refresh"></td></tr>';
        }
    };

    for ( var ID_item in this.products ) { // основная запись
        this.descriptionElement += '<tr data-id="' + this.ID + '" class="table-order__spoiler status-ready"><td class="table-order__order-number">#'
            + this.ID + '-' + index + '</td><td class="table-order__menu-name">'
            + this.products[ID_item].priceName + '\
            <button id="count_prod_' + ID_item + '" class="btn-switch-spoiler" type="button">'
            + count + '5\n<span class="arr-up"></span></button>\
            </td><td class="table-order__status-trekking">Готово!</td><td class="table-order__time doc_time">'
            + '20:00</td><td class="table-order__img-product"></td>\
            <td class="table-order__refresh"></td></tr><tr class="table-order__spoiler-content"><td colspan="6"><table class="table-order inner-table">'
            + addedElement( ID_item ) + '</table></td></tr>';
        for ( var i in [] ) { // раскрывающийся список
            this.descriptionElement += '<tr><td class="table-order__order-number">#'
                + this.ID + '-' + index + '</td><td class="table-order__menu-name">'
                + this.products[ID_item].priceName + '</td><td class="table-order__status-trekking">Готово!</td>\
                <td class="table-order__time">0:00</td><td class="table-order__img-product">\
                <button class="btn-switch-img" data-toggle="modal" data-target="#show-img" type="button"></button>\
                </td><td class="table-order__refresh"><button class="btn-refresh" data-toggle="modal" data-target="#rework" type="button"> </button> </td> </tr>';
        }
        index++;
    }
    for ( var i in [] ) { // доп продукты для всего заказа.
        this.descriptionElement += '<tr class="table-order__no-spoiler"><td class="table-order__order-number">#'
            + this.ID + '</td><td colspan="5" class="table-order__menu-name">'
            + name + ' ' + count + 'Набор для суши х2 шт</td></tr>'
    }
};
Order.prototype.showDescription = function () {
    Page.show.DescriptionOrder();

    document.getElementById( 'order_ID' ).innerHTML = '#' + this.ID;
    document.getElementById( 'name_customer' ).innerHTML = this.nameCustomer;
    document.getElementById( 'order_type' ).innerHTML = this.type;
    // document.getElementById('payment').innerHTML = this.payment.name;
    document.getElementById( 'payment_over' ).innerHTML = 'Оплаченно';
    document.getElementById( 'price' ).innerHTML = this.price;
    document.getElementById( 'discount' ).innerHTML = this.discountPercent;
    document.getElementById( 'bonuses' ).innerHTML = this.bonus;
    document.getElementById( 'price_with_discount' ).innerHTML = this.priceWithDiscount;
    document.getElementById( 'note' ).innerHTML = this.note;

    // document.getElementById('img').src = this.products[ID_item]image;
};

$( document ).on( 'click', '.orders_li.ord', function () {
    Cassir.orders[this.dataset.id].showDescription()
} );

function updateCountNotReady() {
    $()
}


var order = {
    ID: 382,
    sideOrder: '',
    timeDelivery: '',
    datePreOrderCook: '',
    nameCustomer: 'dfcz',
    phone: '',
    address: '',
    countPerson: '',
    division: '',
    orgHash: '',
    note: 'asdfjkas;ldjf; asdfa sdfas dfas df',
    discountName: '',
    discountPercent: 0,
    bonus: 0,
    type: 'Delivery',
    price: 200,
    priceWithDiscount: 200,
    priceCurrency: 'p.',

    time: '10:20',

    // orderStatus: ['down', 'collect'],

    // status: ['down', 'collect'],

    payment: {
        name: 'cart',
        price: 123
    },

    products: {
        ID_item: {
            order_id: 382,
            ID_item: '',
            ID_parent_item: 382,
            price_id: '',
            priceName: 'Ролл "Филадельфия"',
            type_id: '',
            typeName: '',
            parent_id: '',
            parentName: '',
            image: 'img/roll.png',
            units: 'шт',
            value: 2,
            set: 0,
            finished: 0,
            discountName: '',
            discountPercent: '',
            price: 100
        }
    }
};