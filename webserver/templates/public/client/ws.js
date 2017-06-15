var ws
    , CLOSE = false
    , $url = $( '#url' ).css( 'color', 'darkred' ).val( $.cookie( 'url' ) )
    , $textarea = $( '#textarea' ).val( $.cookie( 'textarea' ) )
    , $autoMsg = $( '#auto_msg' ).val( $.cookie( 'auto_msg' ) )
;
// '{"HashAuth":"1bcb953ddc497d3dfb81afa61f6d67a0b78aa4c7797329a5e9b6bac57aae32ad"}'
// $url.val("ws://37.46.134.23:8080/ws" );

function webSocket( url ) {
    CLOSE = false;

    url = url || $url.val();

    ws = new WebSocket( url );
    ws.onerror = function ( e ) {

    };
    ws.onclose = function () {
        $( '#url' ).css( 'color', 'darkred' );
        if ( $( "#reconnect" ).is( ":checked" ) && !CLOSE ) {
            setTimeout( webSocket, 5000 );
        }
    };
    ws.onmessage = function ( msg ) {
        console.log( 'msg', msg );
        $( '#message_field' ).prepend( '<div class="msg in" ><button class="del">Del</button>' + msg.data + '</div>' )
    };
    ws.onopen = function () {
        if ( $autoMsg.val() !== '' ) {
            ws.send( $autoMsg.val() );
        }
        $( '#url' ).css( 'color', '#1d6e1d' )
    };
}

function send() {
    var msg = $textarea.val();
    try {
        ws.send( msg );
        $( '#message_field' ).prepend( '<div class="msg send" ><button class="del">Del</button>' + msg + '</div>' )
    } catch ( e ) {
        $( '#message_field' ).prepend( '<div style="background-color: darkred; color: #f3fdff" class="msg send" ><button class="del">Del</button>' + e + '</div>' )
    }
}


$( document ).on( 'click', '#connect', function () {
    webSocket();
} );
$( document ).on( 'keyup', '#url', function ( ev ) {
    if ( ev.keyCode === 13 ) {
        webSocket();
    }
} );
$( document ).on( 'click', '#disconnect', function () {
    CLOSE = true;
    ws.close();
} );
$( document ).on( 'click', '#save_url', function () {
    $.cookie( 'url', $url.val(), { 'path': '/', 'expires': new Date( '2997-06-14T17:26:13.980Z' ) } )
} );


$( document ).on( 'keyup', '#textarea', function ( ev ) {
    if ( ev.keyCode === 13 ) {
        send();
    }
} );
$( document ).on( 'click', '#send', function () {
    send();
} );

$( document ).on( 'click', '#save_textarea', function () {
    $.cookie( 'textarea', $textarea.val(), { 'path': '/', 'expires': new Date( '2997-06-14T17:26:13.980Z' ) } )
} );
$( document ).on( 'click', '#clear_textarea', function () {
    $textarea.val( '' );
} );


$( document ).on( 'click', '#clear_msg', function () {
    $( '#message_field' ).empty();
} );
$( document ).on( 'change', '#height', function () {
    $( '#message_field' ).css( 'max-height', this.value );
    $( '#_message_field' ).css( 'max-height', +this.value - 19 );
} );
$( document ).on( 'click', '.del', function () {
    $( this.parentNode ).remove();
} );


$( document ).on( 'click', '#auto_msg_save', function () {
    $.cookie( 'auto_msg', $autoMsg.val(), { 'path': '/', 'expires': new Date( '2997-06-14T17:26:13.980Z' ) } )
} );

