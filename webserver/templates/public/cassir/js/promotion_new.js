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

Promotion.prototype.