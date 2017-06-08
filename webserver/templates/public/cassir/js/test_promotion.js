var TIME_EMPTY = "0000-01-01T00:00:00Z";
////////--------| Constructors |----------------------------------------------------------
function Promotion( data ) {
    var i;
    for ( i in data ) {
        this[i] = data[i];
    }
    this.condition = []; // список условий
    this.overall = []; // сгрупированный список того что подходит под условия
    this.availableList = []; // список елементов корзины на которые можно назначить скидку

    Promotion.list[this.ID] = this
}

Promotion.list = {};
Promotion.selectedDiscount = false; // выбранная скидка если скидка на весь чек
Promotion.selectList = {}; // все активированные акции

Promotion.Subjects = function ( data ) {
    if ( data.PresentOrChecking ) {
        Promotion.list[data.Promotions_id].Present = data;
    } else {
        Promotion.list[data.Promotions_id].Checking = data;
    }
};

Promotion.all = function ( func ) {
    var i;
    for ( i in Promotion.list ) {
        Promotion.list[i][func]();
    }
};
//--------------\ Constructors |----------------------------------------------------------

////////--------| Проверки |----------------------------------------------------------

// создание функции для проверки условий
Promotion.prototype.setupChecks = function () {
    var i, self = this;
    for ( i in this.CheckingType_id ) {
        (function () {
            var index = i;
            if ( self.CheckingType_id[i] === 1 ) {
                self.condition[i] = function () {
                    if ( Cart.getType() === TAKEAWAY ) { // проверяем на вынос ли
                        var cart = [], j;
                        for ( j in Cart.list ) {
                            cart.push( Cart.list[i] );
                        }
                        self.overall[index] = Cart.list.length !== 0 && cart.length === Cart.list.length;
                    } else {
                        self.overall[index] = false;
                    }
                };
            } else if ( self.CheckingType_id[i] === 2 ) { // проверка день рождения
                self.condition[i] = function () {
                    var cart = [], j;
                    for ( j in Cart.list ) {
                        cart.push( Cart.list[j] );
                    }
                    self.overall[index] = Cart.list.length !== 0 && cart.length === Cart.list.length;
                }
            } else if ( self.CheckingType_id[i] === 3 ) { // проверка по набору
                self.condition[i] = function () {
                    var list = [], list2 = [], j, jj
                        ;
                    for ( j in Cart.list ) {
                        jj = Cart.list[j];
                        // проверяем условие.
                        if ( (self.Checking.Price_id.length === 0 || ~self.Checking.Price_id.indexOf( jj.Price_id ))
                            && (self.Checking.NameParameterForType.length === 0 || ~jj.PriceName.indexOf( ',' + self.Checking.NameParameterForType ))
                            && (self.Checking.Type_id === 0 || self.Checking.Type_id === jj.Type_id) ) {
                            list2.push( j );
                            if ( self.ForEach ) {
                                if ( self.Checking.Count === 1 ) {
                                    list.push( j );
                                } else if ( self.Checking.Count === list2.length ) {
                                    list.push( list2 );
                                }
                            } else {
                                list.push( j );
                            }
                        }
                    }
                    if ( !self.ForEach && list.length < self.Checking.Count ) {
                        list = [];
                    }
                    // возвращается false если ни чего не подходит под условия акции
                    // , массив индексов в корзине, если ForEach и количество необходимое для активации акции === 1
                    // , массив индексов в корзине, если ForEach === false
                    // , массивы индексов в корзине, обёрнутые в массив, если ForEach и количество необходимое для активации акции > 1
                    self.overall[index] = (list.length !== 0 ? list : false);
                };//////////////////////////////////////////////////////////////////////////////////////
            }
        })()
    }
};

//проверка всех условий.
Promotion.checkAll = function () {
    var i, ii, j, k;
    for ( i in Promotion.list ) { // проверяем доступные акции в данный момент
        ii = Promotion.list[i];
        for ( j in ii.condition ) {
            ii.overall = [];
            ii.condition[j]();
        }
        if ( ~ii.overall.indexOf( false ) ) { // ставим в overall false если там есть false
            ii.overall = false;
        } else if ( ii.overall.length === 1 ) {
            if ( Array.isArray( ii.overall[0] ) ) { // в overall ставим массив доступных елементов
                ii.overall = ii.overall[0];
            } else { // или true
                ii.overall = true;
            }
        } else if ( ii.overall.length === 2 ) { // в overall ставим массив доступных елементов
            for ( k in ii.overall ) if ( Array.isArray( ii.overall[k] ) ) {
                ii.overall = ii.overall[k];
            }
        }
    }
};
//--------------\ Проверки |----------------------------------------------------------

////////--------| Подарки |----------------------------------------------------------
Promotion.idForRadio = counter();
Promotion.indexForPresent = counter();
Promotion.prototype.setupSelector = function () {
    if ( this.PresentType_id === 5 ) {// "Скидка на весь чек"
        this.select = function () {
            if ( this.overall ) {
                Promotion.selectList[this.ID] = true;
                Promotion.selectDiscount = { Name: this.Name, Value: this.Present.Value }
            }
        };
        this.unSelect = function () {
            Promotion.selectDiscount = false
        }
    } else if ( this.PresentType_id === 6 ) {// "Скидка на выбранный(-ые) товар"
        if ( this.ForEach ) {
            this.select = function () {
                if ( !Promotion.selectList[this.ID] ) {
                    Promotion.selectList[this.ID] = { indexCart: [] };
                }
                var prod;
                var i, ii;
                for ( i in this.overall ) {
                    ii = this.overall[i];
                    prod = Cart.list[ii];
                    Promotion.selectList[this.ID].indexCart.push( ii );
                    prod.DiscountPercent = this.Present.Value;
                    prod.DiscountName = this.Name;
                }
                Cart.showPrice(); // обновляем цену
            };
        }
        this.unSelect = function () {
            var prod;
            while ( Promotion.selectList[this.ID].indexCart.length > 0 ) {
                prod = Cart.list[Promotion.selectList[this.ID].indexCart.pop()];
                prod.DiscountPercent = 0;
                prod.DiscountName = null;
            }
            Cart.showPrice(); // обновляем цену
            delete Promotion.selectList[this.ID];
        }
    } else if ( this.PresentType_id === 7 ) { // "Скидка на дополнительный товар"
        if ( this.ForEach && this.Checking.Count === 1 ) {
            this.select = function ( Price_id, indexInCart ) {
                if ( !Promotion.selectList[this.ID] ) { // обявляем массив
                    Promotion.selectList[this.ID] = { indexCart: [] }
                }
                Promotion._selectDiscount = { // записываем сведения о подарке
                    DiscountPercent: this.Present.Value, DiscountName: this.Name
                    , ID: this.ID, presentForIndex: indexInCart
                };
                Product.setCountCart( Price_id, Price_id, 1 ); // добавляем продукт
                if ( !Cart.list[indexInCart].presentIndex ) {
                    Cart.list[indexInCart].presentIndex = {};
                }
                var presentN = Promotion.indexForPresent();
                Cart.list[indexInCart].presentIndex[presentN] = Promotion._selectDiscount;
                // записываем в список выбранных индексы 1: для чего подарок, 2: сам подарок
                Promotion.selectList[this.ID].indexCart.push( [indexInCart, Promotion._selectDiscount, presentN] );
                delete Promotion._selectDiscount; // удаляем

                Cart.showPrice(); // обновляем цену
            };
            //////////////////////////////////////////////////////////////////////////////////////
            this.unSelect = function ( indexInCart, presentN ) {
                if ( Cart.list[indexInCart] ) {
                    var x = findAllProp( 0, indexInCart, Promotion.selectList[this.ID].indexCart )
                        , prod = Cart.list[Cart.list[indexInCart].presentIndex[presentN]]
                        ;

                    delete Cart.list[Cart.list[indexInCart].presentIndex[presentN]];
                    delete Cart.list[indexInCart].presentIndex[presentN];
                    Promotion.selectList[this.ID].indexCart.splice( x[0][0], 1 );
                    Cart.showPrice(); // обновляем цену
                    Product.list[prod.Price_id].updateCunt(); //  для удаления из боковой панели
                }
            };
            this.unSelectAll = function () {
                var i, ii;
                if ( Promotion.selectList[this.ID] ) {
                    for ( i = Promotion.selectList[this.ID].indexCart.length - 1; i > -1; i-- ) {
                        ii = Promotion.selectList[this.ID].indexCart[i];
                        this.unSelect( ii[0], ii[2] )
                    }
                }
            };
            this.unSelectForProd = function ( indexInCart ) {
                var i;
                if ( Promotion.selectList[this.ID] ) {
                    for ( i in Cart.list[indexInCart].presentIndex ) {
                        this.unSelect( indexInCart, Cart.list[indexInCart].presentIndex[i] )
                    }
                }
            };
            this.showPresent = function () {
                var elem = '<div style="width: 100%; border-bottom: 1px solid #9d9d9d;" class="panel-heading" role="tab" id="heading_promotion'
                    + this.ID + '"><a data-toggle="collapse" data-parent="#accordion" href="#collapse_promotion'
                    + this.ID + '" aria-expanded="true" aria-controls="collapse_promotion' + this.ID + '">'
                    + this.Name + '<span class="count" id=""></span>' +
                    '</a></div><div style="width: 100%; border-bottom: 1px solid #9d9d9d;" id="collapse_promotion'
                    + this.ID + '" class="panel-collapse collapse in" role="tabpanel" aria-expanded="true" aria-labelledby="heading_promotion'
                    + this.ID + '"><div class="panel-body">';

                var presentElem
                    , i, ii, j, jj, prod, idForRadio;
                for ( i in this.overall ) {
                    ii = this.overall[i];
                    presentElem = "";
                    for ( j in this.Present.Price_id ) {
                        jj = this.Present.Price_id[j];
                        prod = Product.list[jj];
                        idForRadio = Promotion.idForRadio();
                        presentElem += '<div class="panel-body" style="padding: 5px; width: 100%;"><div>\
                        <input data-id_promo="' + this.ID + '" data-index_in_cart="' + ii + '"  id="radio_for_present_' + idForRadio + '" name="' + ii + '" style="width:auto" value="'
                            + prod.Price_id + '" type="radio"><label for="radio_for_present_' + idForRadio + '">' + prod.PriceName + '</label></div></div>'
                    }
                    elem += '<div style="border-bottom: 1px solid #9d9d9d;"><label class="blue_txt">' + Cart.list[ii].PriceName + '</label>' + presentElem + '</div>';

                }
                elem += '</div></div>';
                $( '#promotion' ).append( elem )
            };
        }
    }
};

$( document ).on( 'change', 'input[id^="radio_for_present_"]', function ( v ) {
    console.log( 'This.value', v );
    Promotion.list[this.dataset.id_promo].unSelectForProd( this.dataset.index_in_cart );
    Promotion.list[this.dataset.id_promo].select( this.value, this.dataset.index_in_cart );
} );


//--------------\ Подарки |----------------------------------------------------------


Promotion.setup = function () {
    Promotion.all( 'setupChecks' );
    Promotion.all( 'setupSelector' );
    Promotion.checkAll();
};
////////--------|// TEST LINE(S) ////////////////////////|----------------------------------------------------------


// function showPromo() {
//     console.log( 'Promotion.list', Promotion.list );
//     console.log( 'PromotionType.list', PromotionType.list );
//     console.log( 'PromotionSubjects.list', PromotionSubjects.list );
// }


function TESTPromo() {
    console.clear();
    Product.setCountCart( 127, 127, 1 );
    Product.setCountCart( 127, 127, 1 );
    Product.setCountCart( 231, 231, 2 );
    Product.setCountCart( 231, 231, 2 );
    Promotion.checkAll();
    for ( var i in Promotion.list ) {
        console.log( 'Promotion.list[i].condition[0](); ', Promotion.list[i].overall, Promotion.list[i].Name );
    }
    Promotion.list[1].select();
    console.group( 'i in Promotion.list[1].overall' );
    for ( var i in Promotion.list[1].overall ) {
        var prod = Cart.list[Promotion.list[1].overall[i]];
        console.log( '.PriceName', prod.PriceName );
        console.log( prod.DiscountName !== null, '.DiscountName', prod.DiscountName );
        console.log( prod.DiscountPercent !== 0, '.DiscountPercent', prod.DiscountPercent );
    }
    console.groupEnd();
    Promotion.list[1].unSelect();
    console.group( 'i in Promotion.list[1].overall UNSELECT' );
    for ( var i in Promotion.list[1].overall ) {
        console.log( '.PriceName', Cart.list[Promotion.list[1].overall[i]].PriceName );
        console.log( prod.DiscountName === null, '.DiscountName', prod.DiscountName );
        console.log( prod.DiscountPercent === 0, '.DiscountPercent', prod.DiscountPercent );
    }
    console.groupEnd();


    console.group( 'Скидка на соус' );
    Promotion.list[7].select( 402, 1 );
    Promotion.list[7].select( 402, 0 );
    for ( var i in Promotion.selectList[7].indexCart ) {
        console.log( 'ADD' );
        console.log( Cart.list[Promotion.selectList[7].indexCart[i][0]].PriceName );
        console.log( Cart.list[Promotion.selectList[7].indexCart[i][0]].DiscountName );
    }
    Promotion.list[7].unSelectAll( 1 );
    console.assert( Promotion.selectList[7].indexCart.length === 0, 'Скидка на соус не удалилась' );
    console.groupEnd();


    Promotion.list[6].showPresent();

}

wait( 'asdfasdfqwergbb56756asd', TESTPromo, 2500 );


function findAllProp( prop, val, c ) {
    var i, ii, obj = c || Cart.list, list = [], listE = []
        , arr = (Array.isArray( val ) ? val : [val]);
    for ( i in obj ) {
        ii = obj[i];
        if ( ~arr.indexOf( ii[prop] ) ) {
            list.push( i );
            listE.push( ii );
        }
    }
    return [list, listE];
}

checkAllTrue = function ( obj ) {
    var i;
    for ( i in obj ) {
        if ( !odj[i] ) {
            return false;
        }
    }
    return true;
};
//--------------\// TEST LINE(S) ////////////////////////|----------------------------------------------------------
