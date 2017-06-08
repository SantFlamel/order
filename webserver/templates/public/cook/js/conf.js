var sideOrder = { 1: "телефон", 2: "кассир", 3: "почта", 4: "приложение" },
    povar_hash = "8746fffb4f2e033aabefa8103e7e4f4d183f0098f1e6513a718c0dcff60be6c2048faaefc6477973c321c8f7c52c96d078c99b188ac2a11a221fb97fa957ccd3",
    courier_hash = "34876c15cf8bcdd3261aa10c29c84d9df529d5f784e1dc39ef84240fac8e54c3366dd6b9420023ded5fa4965f1392f16aa1687fde41fd7825d1e11a1686abe9c",
    cassir_hash = "dcfb7d4d43418b73fba6be0d51ce988e1a84dacda379e3ba3e1f3bef932d4c92c074009d331af45875dabc4fcf6e161925b93d1e67336f13540dfe4af063b556",
    operator_hash = "30a88dcd705dda89507babfb30c44c2d0fd42e5ed7b4c453290a6b6e919937f7344bca0bbb8de040573254f728658869e1e069b50a70766a03a8a2be463ec5e6",
    sushist = "8746fffb4f2e033aabefa8103e7e4f4d183f0098f1e6513a718c0dcff60be6c2048faaefc6477973c321c8f7c52c96d078c99b188ac2a11a221fb97fa957ccd3",
    pizza = "b6b8c237446b537594a2e1fc44d1d522b0ac62ef3e157e940eb39db9c45deefe151ee05a292e8366127c26901efca3882670d1c53ba11c1169c3c53a71b686c2";

//серверная версия
var addressWS = 'ws://order.yapoki.net:8080/ws';
var auth_page = 'http://yapoki.net:7070';
//локальная версия


//DEBUG

var Auth_redirect = false;
var role_test_debug = false;
// var Auth_redirect =true;


var WS_TIMEOUT = 500 // таймаут переподключения.
    , WS_ERROR_TIMEOUT = 7000 // время за которое должен прийти ответ на сообщение, иначе выдаётся предупреждение
    , COUN_RE_SEND = 5 // коллиество попыток повторной отпарвки
    , WS_WAIT_RE = 300 // повторная отправка запросов.
    , ALERT_TIME = 10000 // время показа предупреждения
    , FREEZE_IMPORTANT_ALERT = 2000 // время блокировки предупреждения.
    , TIMEOUT_UPDATE = 500 // таймаут перед обновлением страницы


    , WS_URL = 'ws://37.46.134.23:8080/ws'
    // , WS_URL = 'ws://192.168.0.63:80/ws'

    , AUTH_URL = 'http://yapoki.net:7070'

    // local login: 888, pass: 888
    // net login: 5, pass: 5
    , SESSION_HASH = $.cookie( 'hash' )
    , SIDE_ORDER = 2 // сторона принятия заказа
    // "Пролетарская" "57"
    // , ORG_HASH = "1854b653819e6cdd44feb00321e54cf398cba9672e78ec9ba9ad1c6b92de8b47e8d97f5788450778d89d646a054e451e341946a8f87e57edc8681a27e0e065d0"
    // "5 микрорайон" "33"
    // , ORG_HASH = "d5f702eb3d250ffe09d8a16677015f450290242dfb86db14231806abaa315951a4d900ecc8ea42bb864f8b4bad51fdb480d192605da599ab2462eba9d414f6c0"
    // "Гоголя" "36"
    , LIMIT_IN_CART = 500


    ;
////////--------| OTHER |----------------------------------------------------------
var NO_NAME = 'Без имени'
    , DELIVERY = 'Доставка'
    , TAKEAWAY = 'Навынос'

    // Типы оплаты
    , CARD = 'Картой'
    , CASH = 'Наличными'
    , BONUS = 'Бонусами'
    // Типы действий
    , WITHDRAWAL = 'Изъятие' // изятие
    , DEPOSIT = 'Внесение' // внесение
    , PAYMENT = 'Оплата' // оплата
    , RETURN = 'Возврат'
    , EMPTY_TIME = "0001-01-01T00:00:00Z"
    , DELYVERYMAN_HASH = '34876c15cf8bcdd3261aa10c29c84d9df529d5f784e1dc39ef84240fac8e54c3366dd6b9420023ded5fa4965f1392f16aa1687fde41fd7825d1e11a1686abe9c'
    ;

if ( ~window.location.href.indexOf( 'http://localhost:63342' ) ) {
    WS_URL = 'ws://192.168.0.73:80/ws';
    SESSION_HASH = "87ef4897c3ca69fbd6cb46f9b6e0787e4c5a7bc1facab824aae9d4f297e24dff";

    addressWS = 'ws://192.168.0.73:80/ws';
    auth_page = 'http://192.168.0.73:7070';
    var minimal_cook_time = "00:00:15";  //минимальное время после которого повар сможет нажать готово
}

//WS_URL = 'ws://192.168.0.73:80/ws';

if ( WS_URL == 'ws://192.168.0.73:80/ws' ) {
    SESSION_HASH = "99e92e74645ca0059b71dcb2f4bf262c4725560ad5027da2bbe27c0126233d85"; //суши
    // SESSION_HASH = "03d40c49b4c045627e2ffc00eaeb8791a2fc809d213ee2d4c57ee8fca06bb217" ; //пицца
    povar_hash = "8746fffb4f2e033aabefa8103e7e4f4d183f0098f1e6513a718c0dcff60be6c2048faaefc6477973c321c8f7c52c96d078c99b188ac2a11a221fb97fa957ccd3",
        courier_hash = "1",
        cassir_hash = "a37264bf492a3928503828df00998e7312a686ece4a577fd58cc211cb00bf635af1ea9dead1e858d3f89fd541c826c1a891db4b7cbcea3b0e4953d4bf270d820",
        operator_hash = "9bee038cd95662523e768285107578b2e6570d1ded4ca0bf6b428c70c6a0142f2fdb8e04a64500cf0beea2a761c64e448ab47de0ab5012851f7b2967b520bd42";
    sushist = "8746fffb4f2e033aabefa8103e7e4f4d183f0098f1e6513a718c0dcff60be6c2048faaefc6477973c321c8f7c52c96d078c99b188ac2a11a221fb97fa957ccd3";
    pizza = "5f174cd87d8fa0d9e2405f021c3d691ff6a198e623d5754139018e47033a8977631f3b3b61f36c6da4697f36ebcbc43bc00269caf6ff47b8a5c357d526bfd315";
    role_test_debug = true;
    var test_role_hash = pizza;
    test_role_hash = sushist;
}