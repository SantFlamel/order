var TEST = false;
////////--------| setup test |----------------------------------------------------------
if ( ~window.location.href.indexOf( 'http://localhost:63342' ) ) {
    AUTH_URL = '';
    WS_URL = 'ws://192.168.0.73:80/ws';
    DELYVERYMAN_HASH = '1';
    SESSION_HASH = 'f4b04c0d79f9f0867b6b587d3d8bac09234d76ae935a0818eb9293217644c38a';


    // для приготовления елементов заказа
    setReadyElement = function ( ID, id_item ) {
        if ( id_item ) {
            MSG.set.status( ID, id_item, 8 );
            MSG.set.finished( ID, id_item, true );
        } else {
            var i;
            Order.list[ID].setStatus( 8, true );
            for ( i in Order.list[ID].OrderList ) {
                MSG.set.finished( ID, i, true );
            }
        }
    };
    // wait('asdfasdfasdfasdfkl;34;l12k3;l4123kl;', function (  ) {
    //     Page.show.Carts();
    // }, 2000 )
}
function TESTScript( src ) {
    var script = document.createElement( 'script' );
    script.src = src;
    document.body.appendChild( script );
}
// cookie.set('hash', 'ea556e1c50d1a08a4b8ce683cb5ab4d9b16a913af83d7fe9c8718c52c11fe3bc')
TESTScript( '../../public/cassir/js/promotion.js' );
if ( cookie.get( 'TEST' ) === 'true' ) {
// cookie.set( 'TEST', true );
    console.log( 'TEST' );
    TEST = true;
    // TESTScript( '../../public/cassir/js/test_promotion.js' );
    warning( 'TEST' );
    // TESTScript( '../../public/cassir/js/promotion.js' );
    BEGIN_TIME_FOR_ORDER = Page.time( new Date( 1900, 1, 1, 0, 0, 0, 0 ) ); // время с которого запрашиваются заказы
    ////////--------| address |----------------------------------------------------------
    document.getElementById( 'client_name' ).value = 'Ден';
    document.getElementById( 'client_phone' ).value = '+7(909)777-77-77';
    document.getElementById( 'street_client' ).value = 'Пролетарская';
    document.getElementById( 'home_number' ).value = '57';
    document.getElementById( 'corp_str' ).value = 'a';
    document.getElementById( 'podyezd' ).value = '3';
    document.getElementById( 'level' ).value = '14';
    document.getElementById( 'kv_of' ).value = '45';
    document.getElementById( 'cod' ).value = '*78*';
    function ProfileT( name ) {
        this.count = 0;
        this.time = 0;
        this.listRun = [];
        ProfileT.list[name] = this
    }

    ProfileT.list = {};

    ProfileT.show = function () {
        console.table( ProfileT.list );
    };
    ProfileT.prototype.start = function () {
        var self = this
            , _start = new Date;
        this.listRun.push( function () {
            self.time += (new Date() - _start);
            self.count++;
        } );
    };
    ProfileT.prototype.stop = function () {
        (this.listRun.pop())();
    };
    ProfileT.prototype.reset = function () {
        this.count = 0;
        this.time = 0;
        this.listRun = [];
    };
    ProfileT.resetAll = function () {
        var i, ii;
        for ( i in ProfileT.list ) {
            ii = ProfileT.list[i];
            ii.reset();
        }
    };
    // var TESTPROFILE = new ProfileT( 'TEST' );
    // TESTPROFILE.start();
    // wait( 'setp1', function () {
    //     TESTPROFILE.stop();
    // }, 1000 );
    // TESTPROFILE.start();
    // wait( 'setp2', function () {
    //     TESTPROFILE.stop();
    // }, 1000 );
    // TESTPROFILE.start();
    // wait( 'setp3', function () {
    //     TESTPROFILE.stop();
    // }, 1000 );
    // TESTPROFILE.start();
    // wait( 'setp4', function () {
    //     TESTPROFILE.stop();
    // }, 1000 );
    // TESTPROFILE.start();
    // wait( 'setp5', function () {
    //     TESTPROFILE.stop();
    // }, 1000 );
    // wait( 'showprofile', function () {
    //     console.log( 'ProfileT.list', ProfileT.list );
    //     ProfileT.show();
    // }, 7000 );
    //--------------\ address |----------------------------------------------------------
}
//--------------\ setup test |----------------------------------------------------------


// setInterval( function () {
//     var x = 100, z = 100000000000;
//     for (var i = 0; i < 100000000; i++){
//         x = x * z;
//         x = x * z;
//         x = x * z;
//         x = x * z;
//     }
// }, 20 );