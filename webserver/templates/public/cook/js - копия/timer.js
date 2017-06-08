/**
 * Created by ALEX on 13.02.2017.
 */

function timeMinus (a,b,c){
    //c==0 для минусового таймера возвращает минус значение
    //с==1 плюсует 24 часа при переходе через 0
    //c==2 возвращает разницу в секундах
    var arr = a.split(':');
    var brr = b.split(':');
   // if (c==2) return arr[2]+arr[1]*60 +arr[0]*60*24;
    // if (a.day < b.day) arr[0]= brr[0]+1
    // if (a.day > b.day) arr[1]+=24; переход через 24 часа
    if (arr[0]<brr[0]&&c==0) return '-'+(timeMinus(b,a,c));
    else if (arr[1]<brr[1]&&arr[0]==brr[0]&&c==0)return '-'+(timeMinus(b,a,c));
    else if (arr[1]==brr[1]&& arr[2]<=brr[2]&&c==0) return '-'+(timeMinus(b,a,c));
    if (arr[0]<brr[0]) arr[0]= +arr[0]+24; //переход через 24 часа
    for (var i=arr.length-1;i>=0;i--) {
        if (arr[i]>=brr[i]) arr[i]-=brr[i];
        else { if (i>0){arr[i]=arr[i]-brr[i]+60; --arr[i-1];}else arr[i]=arr[i]-brr[i]+24}
        if(arr[i]<=9) arr[i]= "0" + arr[i];
    }
    if (c==2) {
        return +arr[2]+ +arr[1]*60 + +arr[0]*60*24;
    }
    return arr[0] + ":"+ arr[1]+ ":"+ arr[2];
}

function timePlus (a,b){
    var arr = a.split(':');
    var brr = b.split(':');
    // if (a.day < b.day) arr[0]= brr[0]+1
    // if (a.day > b.day) arr[1]+=24; переход через 24 часа
    //if (arr[0]<brr[0]) arr[0]= +arr[0]+24; //переход через 24 часа
    for (var i=arr.length-1;i>=0;i--) {
        if ((+arr[i]+ +brr[i])<60) arr[i]= +arr[i]+ +brr[i];
        else { arr[i]=+arr[i]+ +brr[i]-60; ++arr[i-1];}
        if(+arr[i]<=9) arr[i]= "0" + arr[i];
    }
    return arr[0] + ":"+ arr[1]+ ":"+ arr[2];
}

function time_second2 (a){
    var  time= new Date(0);
    time.setSeconds(a);
    var time2= time.toUTCString();//toTimeString();
    time2=time2.slice(17,25); //если время не в формате 00:00:00
    var arr = time2.split(":");
    return arr[0] + ":"+ arr[1]+ ":"+ arr[2];

}

function getTime1() {
    var d = new Date();
  //  var day = d.getDate();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds(); //timeorder время в секундах с начала

   // if (day <= 9) day = "0" + day;
    if (hours <= 9) hours = "0" + hours;
    if (minutes <= 9) minutes = "0" + minutes;
    if (seconds <= 9) seconds = "0" + seconds;
    return hours + ":" + minutes + ":" + seconds;
}
function sliceTime(a) {
    if (a.length>20) return a.slice(17,25);
    return a.slice(11,19);
    //  if (b==0)return a.slice(11,19);//время из GO
    //   if (b==1) return a.slice(17,25);//время из JS
    /*   var arr = a.split(':');
     arr = arr.split('T');
     return arr[arr.length-2] + ":"+ arr[arr.length-1];*/
}

function buttons(ok,fry,next) {
    if (ok==1) {$('#order_ok').show();} else {$('#order_ok').hide();}
    if (fry==1){$('#order_not_ok').show();} else {$('#order_not_ok').hide();}
    if (next==1) {$('#order_next').show();} else {$('#order_next').hide();}
    //$('#order_not_ok').show();
}

function time_second (){
    var  time= new Date(0);
    var cook_time = document.getElementById("in_work").getAttribute("title");
    time.setSeconds(+cook_time);
    var time2= time.toUTCString();//toTimeString();
    //  if (time.length > 8)
    time2=time2.slice(17,25); //если время не в формате 00:00:00

    var arr = time2.split(":");
    document.getElementById("in_work").innerHTML = time2;

}

function funcSuccessItem(data){//получает данные заказа и готовит окно order.html
   // return;
    try {
        arrOrder = JSON.parse(data);
        console.log(arrOrder);
    }catch(err){ return }
        if (arrOrder.Time_end_cooking =="0001-01-01T00:00:00Z") {
            buttons(1, 0, 0);
            if (arrOrder.Time_begin_fry != "0001-01-01T00:00:00Z"){
                buttons(0, 0, 1);
            } else if (arrOrder.Type_id==15){buttons(0,1,0);}
        }
    time_second ();
    startTimer();
    time3=timeMinus(timePlus(sliceTime(arrOrder.Time_begin_fry),time_second2 (arrOrder.Time_fry)),getTime1(),0 );
/*if (time3[0]=='-' ){
    console.log('minusssss')
    buttons(1, 0, 0);
};*/


}

function getItem(str){
    var admin = "admin";
    //Вызываем ajax
    $.ajax({
        url:    "/getorder/"+str,//+location.href.slice(22), //То куда отправляем
        type:    "GET", //Тип передачи данных POST, GET
        data:    "",
        dataType:"text",
        success: funcSuccessItem //Когда получен ответ выполняем нашу функцию
    });
}
//getItem(location.href.slice(21));

function addTimerFinishDiv(id, idi, name){ //добавляет уведомление о завершении тайммера
    divId= '#timer' +id+'-'+idi;
  //   divId=divId
    if ($(divId).length!=0) return;
    divId=divId.slice(1);
    linkOrder = '/finishtimer/' + id + '/'+idi + '/'+'ok';
    divTimer=
        '<div class="row timerItem" id='+divId+'>  ' +
        //'<form action="'+linkOrder+'" method="POST" id=F'+divId+'>' +
       // '<a href="javascript:;" onclick="parentNode.submit();return false;">'+ // ""'+linkOrder+' class=" " onclick="this.parent.submit()">' +
        //'<input class="" hidden value="'+ linkOrder+'">' +
        '<a href="#" onclick="removeTimerItem('+id+','+idi+')" class=" close-timerItem"><i class="fa fa-close"></i>'+//</a>'+
       // '<a href="#" class=" ">'   +
        '<p class="font_main_check">#'+ id+'-'+idi+'</p>' +
        '    <p >'+name+'</p>' +
        '    <p >Я запекся</p>' +
        '</a>' +
    //    '</form>' +
        '</div>';

    $('#timerFinish').prepend(divTimer);
    soundClick();


//         <a href="#" onclick="removeTimerItem()" class="pull-right close-timerItem"><i class="fa fa-close"></i></a>
//         <a href="#" class=" ">
//         <p class="font_main_check">#23-2</p>


    /*
     onClick="document.getElementById('form_ID').submit(); return false;"

     <a href="#myForm" onclick="return submit(this);">Submit</a>
     <form id="myForm">...</form>

     <form action="/finishtimer/" method="POST">
<select name="user_role"> {{range $type := .cook.TypeCook }}
<option value="{{$type}}">{{$type}}</option> {{end}} </select>
</form>
*/
}

function delTimerProgressbar(timer){ //удаляет прогрессбар сверху
    $(timer).parent().parent().remove();
}


function removeTimerItem(id,idi) {
    //POST id idi

    // $.post( "ajax/test.html", function( data ) {
    //     $( ".result" ).html( data );
    // });

    // $.ajax({
    //     type: "POST",
    //     url: url,
    //     data: data,
    //     success: success,
    //     dataType: dataType
    // });
    //finishtimer
    //
    $.post( "/finishtimer", { Id: id, Idi: idi } );

    $('.timerItem:hover').remove();
}

function beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    snd.play();
}

function soundClick() {
    var audio = new Audio(); // Создаём новый элемент Audio
    audio.src = '/public/js/ring.mp3'; // Указываем путь к звуку "клика"
    audio.autoplay = true; // Автоматически запускаем
}