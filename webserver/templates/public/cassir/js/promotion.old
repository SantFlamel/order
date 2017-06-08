var TIME_EMPTY = "0000-01-01T00:00:00Z";
// TODO: если для сотрудников то акции не действуют
////////--------| Constructors |----------------------------------------------------------
function Promotion( data ) {
    if ( !(this instanceof Promotion) ) {
        return new Promotion( data );
    }
    var i;
    for ( i in data ) {
        this[i] = data[i];
    }
    this.condition = []; // список условий
    this.overal = []; // сгрупированный список того что подходит под условия
    this.availableList = []; // список елементов корзины на которые можно назначить скидку
    this.listApplyPresent = [];

    Promotion.list[this.ID] = this
}
Promotion.list = {};
Promotion.selectedDiscount = false; // выбранная скидка если скидка на весь чек
Promotion.selectList = {}; // все активированные акции

function PromotionType( data ) {
    PromotionType.list[data.ID] = data;
}
PromotionType.list = {};
function PromotionSubjects( data ) {
    PromotionSubjects.list[data.ID] = data;
}
PromotionSubjects.list = {};

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
    if ( this.condition.length !== 0 ) {
        return;
    }
    var ch = findAllProp( 'Promotions_id', this.ID, PromotionSubjects.list )
        , condition = findAllProp( 'PresentOrChecking', false, ch[1] )[1][0]
        , self = this
        ;
    // По набору
    var i, ii, index = [];
    if ( ~this.CheckingType_id.indexOf( 3 )
        && !~this.CheckingType_id.indexOf( 4 ) ) {
        this.condition.push( function ( indexInOveral ) {
            self.overal[indexInOveral] = [];
            index = [];
            for ( i in Cart.list ) {
                ii = Cart.list[i];
                if ( (condition.Type_id === 0 || condition.Type_id === ii.Type_id)
                    && ( condition.Price_id.length === 0 || ~condition.Price_id.indexOf( ii.Price_id ))
                    && (condition.NameParameterForType === '' || ~ii.PriceName.indexOf( condition.NameParameterForType )) ) {
                    index.push( i );
                    if ( self.ForEach && index.length === condition.Count ) {
                        self.overal[indexInOveral].push( index );
                        index = [];
                    }
                }
            }
            if ( !self.ForEach && index.length >= condition.Count ) {
                self.overal[indexInOveral].push( index );
            }
            if ( self.overal[indexInOveral].length === 0 ) { // false если пустой
                self.overal[indexInOveral] = false;
            }
        } )
    }
    // Если доставка навынос
    if ( ~this.CheckingType_id.indexOf( 1 ) ) {
        this.condition.push( function ( indexInOveral ) {
            if ( Cart.getType() === TAKEAWAY && Cart.list.length !== 0 ) {
                index = [];
                for ( i in Cart.list ) {
                    index.push( i );
                }
                if ( index.length !== 0 ) {
                    self.overal[indexInOveral] = [index];
                } else { // false если пустой
                    self.overal[indexInOveral] = false;
                }
            }
        } )
    }
    // день рождения
    if ( ~this.CheckingType_id.indexOf( 2 ) ) {
        this.condition.push( function ( indexInOveral ) {
            index = [];
            for ( i in Cart.list ) {
                index.push( i );
            }
            if ( index.length !== 0 ) {
                self.overal[indexInOveral] = [index];
            } else { // false если пустой
                self.overal[indexInOveral] = false;
            }
        } )
    }
};

// провверка условий для данной акции
Promotion.prototype.check = function () {
    var i;
    this.overal = [];
    for ( i in this.condition ) {
        this.condition[i]( i )
    }
};
// выполнение проверка всей корзины
Promotion.checkAll = function () {
    console.groupCollapsed( 'Promotion.checkAll' );
    var i, ii;
    for ( i in Promotion.list ) {
        Promotion.list[i].check();
        ii = Promotion.list[i];
        console.log( 'Promotion.list[' + ii.ID + '].overal  --  ' + ii.Name + '\n', Promotion.list[i].overal, '\n\n' );
    }
    console.groupEnd();
};

// собирает доступные елементы для акции
Promotion.prototype.setupAvailableList = function () {
    console.group( 'setupAvailableList', this );
    var i, arr = [], arr1, index = this.CheckingType_id.indexOf( 1 );
    console.log( 'This.overal[0][0], this.overal[1][0]', this.overal[0][0], this.overal[1][0] );
    this.availableList = [];
    if ( ~index && this.overal[0] !== false ) {
        for ( i in this.overal[0] ) {
            arr.push( this.overal[0][i][0] );
        }
        this.availableList = arr;
    }
    else {
        if ( this.overal[0][0].length > this.overal[1][0].length ) {
            arr = this.overal[1][0];
            arr1 = this.overal[0][0];
        } else {
            arr = this.overal[0][0];
            arr1 = this.overal[1][0];
        }
        for ( i in arr ) {
            if ( ~arr1.indexOf( arr[i] ) ) {
                this.availableList.push( arr[i] );
            }
        }
    }
    console.groupEnd();
}
;

// проверяем что доступна при данном случае
Promotion.prototype.checkAvailable = function () {
    console.group( 'checkAvailable' );
    var i, ii, count = 0;
    console.groupCollapsed( 'FOR' );
    for ( i in this.overal ) {
        ii = this.overal[i];
        if ( ii === false ) {
            console.log( '%cNO ' + this.Name, 'color: red' );
        } else {
            count++;
            console.log( '%cMAYBE ' + this.Name, 'color: yellow' );
        }
    }
    console.groupEnd();
    if ( count === this.CheckingType_id.length ) {
        this.available = true;
        this.showPresent();
        console.log( '%cYES YES ' + this.Name, 'color: green' );
    } else {
        this.available = false;
    }
    console.groupEnd();
};
Promotion.runAll = function () {
    if ( Cart.list.length === 0 ) {
        $( '#promotion' ).empty();
        return;
    }
    Promotion.reset();
    Promotion.checkAll();
    Promotion.all( 'checkAvailable' );

    // Promotion.all( 'showPresent' );
};
//--------------\ Проверки |----------------------------------------------------------


////////--------| "Подарки" |----------------------------------------------------------
Promotion.prototype.makeCollapseElementHead = function () {
    return '<div style="width: 100%; border-bottom: 1px solid #9d9d9d;" class="panel-heading" role="tab" id="heading_promotion' + this.ID + '">\
                <a data-toggle="collapse" data-parent="#accordion" href="#collapse_promotion' + this.ID
        + '" aria-expanded="true" aria-controls="collapse_promotion' + this.ID + '">'
        + this.Name + '<span class="count" id=""></span>\
        </a>\
        </div>\
        <div style="width: 100%; border-bottom: 1px solid #9d9d9d;" id="collapse_promotion'
        + this.ID + '" class="panel-collapse collapse in" role="tabpanel"\
                aria-expanded="true" aria-labelledby="heading_promotion' + this.ID + '">\
        <div class="panel-body">';
};
Promotion.ID = counter();
// список елементов доступных по акции
Promotion.prototype.makeListElementPresentProduct = function ( IDPresent ) {
    var ch = findAllProp( 'Promotions_id', this.ID, PromotionSubjects.list )
        , present = findAllProp( 'PresentOrChecking', true, ch[1] )[1][0]
        , i, ii
        , elem = ''
        , prod
        ;
    // <input type="radio" name="browser" value="ie">
    for ( i in present.Price_id ) {
        ii = present.Price_id[i];
        prod = Product.list[ii];
        elem += '<div id="present_select' + this.ID + '" class="panel-body" style="padding: 5px; width: 100%;">\
                    <div><input style="width: auto" data-id_present="' + IDPresent + '" name="product_' + this.ID + '_' + IDPresent + '" id="present' + this.ID + '" value="' + prod.Price_id + '" type="radio"><label>' + prod.PriceName + '</label></div>\
                </div>';
    }
    return elem;
};

Promotion.prototype.setupPresent = function () {
    // TODO: при выборе делать пометки? что для этого продукта выбранна акция
    var i, ii, j, jj;
    for ( i in this.overal ) {
        ii = this.overal[i];
        if ( ii.length === 0 ) {
        }
    }
    var ch = findAllProp( 'Promotions_id', this.ID, PromotionSubjects.list )
        , present = findAllProp( 'PresentOrChecking', true, ch[1] )[1][0]
        , self = this
        ;
    if ( this.PresentType_id === 5 ) { // "Скидка на весь чек"
        this.showPresent = function () {
            this.unShowPresent();
            var elem = '<div id="present_select' + self.ID + '" class="blue_txt panel-body" style=" padding: 5px; width: 100%; border-bottom: 1px solid #9d9d9d;">\
                    <div><input style="width: auto" id="present' + self.ID + '" type="checkbox"><label for="present' + self.ID + '">' + this.Name + '</label></div>\
                </div>';
            $( '#promotion' ).append( elem );
        };
        this.unShowPresent = function () {
            $( '#present_select' + self.ID ).remove();
        };
        this.selectPresent = function () {
            self.unSelectedAllConflict();
            Promotion.selectList[self.ID] = {};
            Promotion.selectDiscount = { Name: self.Name, Value: present.Value };
        };
        this.unSelectPresent = function () {
            delete Promotion.selectList[self.ID];
            Promotion.selectDiscount = false;
            $( '#present' + this.ID ).prop( 'checked', false );
        };
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    } else if ( this.PresentType_id === 6 ) { // "Скидка на выбранный(-ые) товар"
        this.showPresent = function () {
            this.unShowPresent();
            var elem = this.makeCollapseElementHead();
            this.setupAvailableList();
            for ( i in self.availableList ) {
                ii = self.availableList[i];
                elem += '<div><input style="width: auto" data-avalible_index="' + ii + '" id="present' + self.ID + '" type="checkbox"><label>' + Cart.list[ii].PriceName + '</label></div>';
            }
            elem += '</div>\
                    </div>';
            $( '#promotion' ).append( elem );
        };
        this.unShowPresent = function () {
            $( '#heading_promotion' + self.ID ).remove();
            $( '#collapse_promotion' + self.ID ).remove();
        };
        this.selectPresent = function ( avalible_index ) {
            self.unSelectedAllConflict( this.ID );
            if ( !Promotion.selectList[this.ID] ) {
                Promotion.selectList[this.ID] = { appointed: [] };
            }
            if ( this.ForEach ) {
                Promotion.selectList[this.ID].appointed.push( avalible_index )
            } else {
                Promotion.selectList[this.ID] = { appointed: [avalible_index] };
            }
            Cart.list[avalible_index].DiscountPercent = present.Value;
            Cart.list[avalible_index].DiscountName = this.Name;
            Cart.showPrice();
        };
        this.unSelectPresent = function () {
            var el;
            for ( i in Promotion.selectList[this.ID].appointed ) {
                el = Promotion.selectList[this.ID].appointed[i];
                Cart.list[el].DiscountName = null;
                Cart.list[el].DiscountPercent = 0;
                $( 'input[id^=\'present' + this.ID + '\']' ).prop( 'checked', false );
            }
            delete Promotion.selectList[self.ID];
            Cart.showPrice();
        };
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    } else if ( this.PresentType_id === 7 ) { // "Скидка на дополнительный товар"
        this.showPresent = function () {
            this.unShowPresent();
            var elem = this.makeCollapseElementHead()
                , IDPresent
                ;

            if ( present.Count == 1 ) {
                for ( i in self.overal ) {
                    for ( j in self.overal[i] ) {
                        IDPresent = Promotion.ID();
                        jj = self.overal[i][j][0];
                        elem += '<div style="border-bottom: 1px solid #9d9d9d;"><label class="blue_txt">' + Cart.list[jj].PriceName
                            + '</label>' + this.makeListElementPresentProduct( IDPresent ) + '</div>';
                    }
                }
            } else if ( this.available ) {
                for ( i in present.Price_id ) {
                    IDPresent = Promotion.ID();
                    ii = present.Price_id[i];
                    elem += '<div data-id_present="' + IDPresent + '" data-id_present="' + this.ID + '" style="border-bottom: 1px solid #9d9d9d;"><label class="blue_txt">' + Product.list[ii].PriceName
                        + '</label><br>'
                        + '<button onclick="'
                        + 'var x = this.nextElementSibling; if (+x.innerHTML > 0){x.innerHTML -= 1;'
                        + 'Promotion.list[' + this.ID + '].selectPresent(' + ii + ', this.parentNode.dataset.id_present, -1)'
                        + '} " class="minus">-</button>' + '<span style="margin-left: 8px" class="blue_txt">0</span>' + '<button onclick="'
                        + 'var sum = 0, sp = $(this).parent().parent().find(\'span\'); $.each(sp ,function(i, el) {sum += +(el.innerHTML);  }); '
                        + 'if (+sum < ' + present.Count * this.overal[0].length + '){'
                        + 'Promotion.list[' + this.ID + '].selectPresent(' + ii + ', this.parentNode.dataset.id_present, +1);'
                        + 'var x = this.previousElementSibling; x.innerHTML = +x.innerHTML + 1;'
                        + '}" class="plus">+</button>'
                        + '</div>';
                }
            }
            elem += '</div>\
                    </div>';
            $( '#promotion' ).append( elem );
        };
        this.unShowPresent = function () {
            $( '#heading_promotion' + self.ID ).remove();
            $( '#collapse_promotion' + self.ID ).remove();
        };
        ////////--------|  |----------------------------------------------------------
        if ( present.Count === 1 ) {
            this.selectPresent = function ( price_id, IDPresent ) {
                self.unSelectedAllConflict( this.ID );
                if ( !Promotion.selectList[self.ID] ) {
                    Promotion.selectList[self.ID] = [];
                }
                // при добавлении в карзину проверяется есть ли скидка, если есть то она применяется
                Promotion._selectDiscount = {
                    DiscountPercent: present.Value, DiscountName: this.Name
                    , IDPresent: IDPresent, ID: this.ID
                };
                // индекс подарка в корзине и массив к чему тот подарок
                var indexInCart = findAllProp( 'IDPresent', IDPresent, Cart.list )[0];
                if ( indexInCart.length !== 0 ) {
                    var prodInCart = Cart.list[indexInCart].Price_id;
                    Cart.list.splice( indexInCart[0], 1 );
                    Cart.getCartCount();
                    Product.list[prodInCart].updateCunt();
                }
                Product.setCountCart( price_id, price_id, 1 );
                if ( this.ForEach ) {
                    Promotion.selectList[self.ID].push( {
                        selectProduct: Promotion._selectDiscount
                    } );
                } else {
                    Promotion.selectList[self.ID] = [{
                        selectProduct: Promotion._selectDiscount
                    }];
                }
                delete Promotion._selectDiscount;
                Cart.showPrice();
            };
        } else { ////////--------|  |----------------------------------------------------------
            this.selectPresent = function ( price_id, IDPresent, val ) {
                self.unSelectedAllConflict( this.ID );
                if ( !Promotion.selectList[self.ID] ) {
                    Promotion.selectList[self.ID] = { selectProduct: [] };
                } else if ( Promotion.selectList[self.ID].selectProduct.length >= (present.Count * this.overal[0].length) && val > 0 ) {
                    return;
                }
                // при добавлении в карзину проверяется есть ли скидка, если есть то она применяется
                Promotion._selectDiscount = {
                    DiscountPercent: present.Value, DiscountName: this.Name
                    , IDPresent: IDPresent, ID: this.ID
                };
                Product.setCountCart( price_id, price_id, val );
                if ( val > 0 ) {
                    Promotion.selectList[self.ID].selectProduct.push( Promotion._selectDiscount );
                } else if ( val < 0 ) {
                    Promotion.selectList[self.ID].selectProduct.pop();
                }
                delete Promotion._selectDiscount;
                Cart.showPrice();
            };
        }//--------------\  |----------------------------------------------------------
        this.unSelectPresent = function () {
            var indexInCart = findAllProp( 'ID', this.ID, Cart.list )[0].reverse()
                , prodInCart
                ;
            for ( i in indexInCart ) {
                Cart.list.splice( +indexInCart[i], 1 );
                prodInCart = Cart.list[indexInCart[i]].Price_id;
                Product.list[prodInCart].updateCunt();
            }
            delete Promotion.selectList[self.ID];
            Cart.showPrice();
            $( '[data-id_presenr="' + this.ID + '"] span' ).html( '0' )
        };
    }
};
$( document ).on( 'click', 'input[type!="radio"][id^="present"]', function () {
    console.group( 'ONCLICK' );
    var self = Promotion.list[this.id.split( 'present' )[1]];
    console.log( 'self', self );
    if ( $( this ).prop( 'checked' ) ) {
        console.log( 'if select' );
        var el;
        try {
            el = this.dataset.avalible_index;
        } catch ( e ) {
        }
        self.selectPresent( el );
        this.checked = true;
    } else {
        console.log( 'else unselect' );
        self.unSelectPresent();
    }
    Cart.showPrice();
    console.log( 'Cart.list', Cart.list );
    console.groupEnd();
} );
$( document ).on( 'click', 'input[type="radio"][id^="present"]', function () {
    console.log( 'Cart.list', Cart.list );
    var self = Promotion.list[this.id.split( 'present' )[1]];
    self.selectPresent( this.value, this.dataset.id_present );
} );
// убираем несовместимые "подарки"
Promotion.prototype.unSelectedAllConflict = function ( ID ) {
    if ( this.allSummarizedWith ) {
        return;
    }
    var i;
    for ( i in Promotion.selectList ) {
        i = +i;
        if ( !~this.SummarizedWith.indexOf( i ) && i !== ID ) {
            try {
                Promotion.list[i].unSelectPresent( true );
            } catch ( e ) {
            }
            try {
                Promotion.list[i].unSelectedAllConflict( true );
            } catch ( e ) {
            }
        }
    }
};

$( document ).on( 'click', '#load_promo', function () {
    Promotion.runAll();
} );

Promotion.reset = function () {
    var i, ii;
    for ( i in Cart.list ) {
        ii = Cart.list[i];
        if ( ii.DiscountName !== null || ii.DiscountPercent !== 0 ) {
            if ( ii.IDPresent ) {
                var id = ii.Price_id;
                Cart.list.splice( i, 1 );

                Product.list[id].updateCunt();
            } else {
                ii.DiscountName = null;
                ii.DiscountPercent = 0;
            }
        }
    }
    for ( i in Promotion.list ) {
        ii = Promotion.list[i];
        try {
            ii.unSelectPresent();
        } catch ( e ) {
        }
    }
};

//--------------\ "Подарки" |----------------------------------------------------------

////////--------| Первичные_действия |----------------------------------------------------------
// устанавливем флаги
Promotion.setFlag = function () {
    var i, ii, lenProm = length( Promotion.list ) - 1;
    for ( i in Promotion.list ) {
        ii = Promotion.list[i];
        ii.allSummarizedWith = (ii.SummarizedWith.length === lenProm);
        ii.allDaysWeek = !~ii.DaysWeek.indexOf( 0 );
        if ( !ii.allDaysWeek && ii.DaysWeek[(new Date().getDay() - 1)] === 0 ) {
            delete Promotion.list[ii.ID]
        }
        if ( ii.DateBegin !== TIME_EMPTY ) {
        }
        if ( ii.DateEnd !== TIME_EMPTY ) {
        }
        if ( ii.TimeBegin !== TIME_EMPTY ) {
        }
        if ( ii.TimeEnd !== TIME_EMPTY ) {
        }
    }
};

// удаляем не актуальные в данный момент акции

// после получения всех таблиц
Promotion._getAll = function () {
    if ( (++Promotion._getAllCounter) === 3 ) {
        Promotion.setFlag();
        Promotion.all( 'setupChecks' );
        Promotion.all( 'setupPresent' );
    }
};
//--------------\ Первичные_действия |----------------------------------------------------------


////////--------|// TEST LINE(S) ////////////////////////|----------------------------------------------------------
// wait( 'promotions', MSG.request.promotions, 500 );


// function showPromo() {
//     console.log( 'Promotion.list', Promotion.list );
//     console.log( 'PromotionType.list', PromotionType.list );
//     console.log( 'PromotionSubjects.list', PromotionSubjects.list );
// }
//
//
// wait( 'asdfasdfqwergbb56756asd', function () {
//     console.clear();
//     // Product.setCountCart( 127, 127, 1 );
//     // Product.setCountCart( 127, 127, 1 );
//     Product.setCountCart( 231, 231, 2 );
//     Promotion.runAll();
//     checkUndefined( Promotion.selectedDiscount, Promotion.list );
// }, 2500 );


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