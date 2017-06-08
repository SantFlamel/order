/**
 * Created by ALEX on 13.04.2017.
 */

var sideOrder = { 1: "телефон", 2: "кассир", 3: "почта", 4: "приложение" },
    povar_hash = "8746fffb4f2e033aabefa8103e7e4f4d183f0098f1e6513a718c0dcff60be6c2048faaefc6477973c321c8f7c52c96d078c99b188ac2a11a221fb97fa957ccd3",
    courier_hash = "34876c15cf8bcdd3261aa10c29c84d9df529d5f784e1dc39ef84240fac8e54c3366dd6b9420023ded5fa4965f1392f16aa1687fde41fd7825d1e11a1686abe9c",
    cassir_hash = "dcfb7d4d43418b73fba6be0d51ce988e1a84dacda379e3ba3e1f3bef932d4c92c074009d331af45875dabc4fcf6e161925b93d1e67336f13540dfe4af063b556",
    operator_hash = "30a88dcd705dda89507babfb30c44c2d0fd42e5ed7b4c453290a6b6e919937f7344bca0bbb8de040573254f728658869e1e069b50a70766a03a8a2be463ec5e6";

//серверная версия
var addressWS = 'ws://order.yapoki.net:8080/ws';
var auth_page = 'http://yapoki.net:7070';

//локальная версия
if ( ~window.location.href.indexOf( 'http://localhost:63342' ) ) {
    $.cookie( "hash", "bcad7184eecbbfef8d0b5a1f7667b27b1ea49a55602d3d06df99e9b113ea02d5" );
    addressWS = 'ws://192.168.0.73:80/ws';
    auth_page = 'http://192.168.0.73:7070';
}


//DEBUG

var Auth_redirect = false;


if ( addressWS == 'ws://192.168.0.73:80/ws' ) {
    povar_hash = "8746fffb4f2e033aabefa8103e7e4f4d183f0098f1e6513a718c0dcff60be6c2048faaefc6477973c321c8f7c52c96d078c99b188ac2a11a221fb97fa957ccd3",
        courier_hash = "1",
        cassir_hash = "a37264bf492a3928503828df00998e7312a686ece4a577fd58cc211cb00bf635af1ea9dead1e858d3f89fd541c826c1a891db4b7cbcea3b0e4953d4bf270d820",
        operator_hash = "9bee038cd95662523e768285107578b2e6570d1ded4ca0bf6b428c70c6a0142f2fdb8e04a64500cf0beea2a761c64e448ab47de0ab5012851f7b2967b520bd42";
}