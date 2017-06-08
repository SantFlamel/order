function Deliveryman( data ) {
    if ( Deliveryman.list[data.UserHash] ) {
        console.log( 'data, Delyveryman.list', data.UserHash, Deliveryman.list, Deliveryman.list.hasOwnProperty( data.UserHash ) );
        return;
    }
    if ( !(this instanceof Deliveryman) ) {
        return new Deliveryman( data );
    }
    var i;
    for ( i in data ) {
        this[i] = data[i];
    }
    Deliveryman.list[this.UserHash] = this;
    var time = Page.time(), timeBeg = Page.timeBeginDay()
        , self = this;
    MSG.request.paymentByDeliveryman( 1, this.UserHash, timeBeg, time );
    MSG.request.paymentByDeliveryman( 2, this.UserHash, timeBeg, time );
    waitProp( function () {
        self.showDelyveryman();
    }, function () {
        return ((self.PayOnDay_1 != undefined) && (self.PayOnDay_2 != undefined));
    }, 200, 30 )
}
Deliveryman.list = {};

Deliveryman.prototype.addPay = function ( pay, value ) {
    this['PayOnDay_' + pay] = value;
    var cl = (pay == 1 ? ' .deliveryman-pay_cash' : ' .deliveryman-pay_check'), v = value, self = this;
    waitProp( function () {
        document.querySelector( '#deliveryman' + self.UserHash + cl ).innerHTML = v
    }, function () {
        return document.querySelector( '#deliveryman' + self.UserHash + cl ) != null;
    }, 300, 30 );
};

Deliveryman.prototype.makeElement = function () {
    console.log( 'Deliveryman.prototype.makeElement' );
    this.element = '<tr id="deliveryman' + this.UserHash + '" class="operation table-cashbox__delivery hidden">\
            <td>' + this.RoleName + ' ' + this.FirstName + ' ' + this.SecondName + '</td>\
            <td>наличными: <span class="deliveryman-pay_cash">-</span>р. \
            <input class="number" data-type="cash" type="text" value="0">\
            <button data-type="cash" type="button">OK</button></td>\
            <td>по чекам: <span class="deliveryman-pay_check">-</span>р. \
            <input class="number" data-type="check" type="text" value="0">\
            <button data-type="check" type="button">OK</button></td>\
            <td>' + '' + '</td><td>' + '' + '</td><td>' + '' + '</td><td>' + '' + '</td>\
        </tr>'
};
Deliveryman.prototype.showDelyveryman = Operation.prototype.showOperation;


Deliveryman.prototype.closeDay = function ( t ) {
    var Cause, type
        ;
    if ( t == 'cash' ) {
        type = 1;
        Cause = 'Внесение наличных за смену курьера';
    } else {
        Cause = 'Подтверждение чеков за смену курьера';
        type = 2
    }
    new Operation( type, this.getInput( t ), Cause, '', null )
};

Deliveryman.prototype.getInput = function ( t ) {
    return +document.querySelector( '#deliveryman' + this.UserHash + ' input[data-type="' + t + '"]' ).value;
};

$( document ).on( 'click', '.table-cashbox__delivery button', function () {
    var hash = this.parentNode.parentNode.id.split( 'deliveryman' )[1]
        , type = this.dataset.type
        , self = Deliveryman.list[hash]
        , label = ''
        , deposit = +self.getInput( type )
        ;
    if ( deposit <= 0 ) {
        return;
    }
    if ( type == 'cash' ) {
        label = 'и внести сумму ' + deposit + 'р.';
    } else if ( type == 'check' ) {
        label = 'и подтвердить чеки на сумму ' + deposit + 'р.';
    }
    document.getElementById( 'deliveryman_fio' ).innerHTML = self.FirstName + ' ' + self.SecondName;
    document.getElementById( 'deliveryman_sum' ).innerHTML = label;
    document.getElementById( 'deliveryman_day_no' ).onclick = function () {
    };
    document.getElementById( 'deliveryman_day_yes' ).onclick = function () {
        self.closeDay( type );
    };
    $( '#deliveryman_day' ).modal( 'show' )
} );

