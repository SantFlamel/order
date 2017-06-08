// 2017-02-02T15:04:05
// 0001-01-01T00:00:00

setInterval(orderTimer,60000);
$("#new_div_tab").hide();
$("#new_div_tab2").hide();
$("#page_cart").hide();

/// отмена заказа - обработка нажатия подтверждения в модальке отмены заказа
$(document).on("click", "#cancelCauseYes", function(event){
    newOrderStatusCancel($(this).attr('title'), $("#cancelCause").val());
    console.log($(this).attr('title') +' '+ $("#cancelCause").val());
    $('#confirm').modal('hide');
});

///при открытии модальки на отмену заказа передает id заказа в след модальку в title
$('#confirm').on('shown.bs.modal', function (event) {
    var id=$(event.relatedTarget).parents(".table-operator__spoiler-content").attr('id');
    id=id.slice(3);
    $("#cancelCauseYes").attr("title", id);
    console.log(id);
});

$(document).on("click", "#main_nav_tab li a",function(){
    buildOrdersTable();
});


function buildOrdersTable(){
    var id =$("#main_nav_tab .active").attr('id');
    console.log(id);

    if (id =="black_tab") {getBlackListOrder(); return;}
    if (id =="new_tab") {
       $(document).ready(function() {
           $("#main_div_tab").hide();
           $("#new_div_tab").show();
           $("#new_div_tab2").hide();
           $("#tab_client").click();
           $("#client_name").val("");
           $("#client_phone").val("");
           $("#comment_order").val("");
           $("#comment_order2").val("");
           $("#ostatok").val("");
           telinfo.count=0;
           reloadClientTel();
           addOrgToPage();
           //addDiscountToPage();
           $("#warning_dellivery").html("");
           $('#take_away_address').prop('selectedIndex', -1);
           getProduct();
           getDeliveryZone("","","");
           if ($("#on_time").is(":checked")) {
               $("#timeFinish1").html(timePlus1($("#select_time").val(), 30));
               $("#timeFinish2").html(timePlus1($("#select_time").val(), 59));
           }else {
               $("#timeFinish1").html(timePlus1(getTimeHM(getTimeOnNow()), 30));
               $("#timeFinish2").html(timePlus1(getTimeHM(getTimeOnNow()), 59));
           }
           Cart.clean();
           Cart.showPrice();
           $("#overall_cost").html($("#over_price").html());
           $( '.product_in_cart' ).remove(); // очищаем боковую панель
           $("#to_workers").prop( "checked", false );
           $("#ignore_delivery").prop( "checked", false );
       });
    }
}

// Переключатель для меню

    $("#main_nav_tab li").click(function(){
        $("#main_nav_tab li").removeClass("active"); //удаляем класс во всех вкладках
        $(this).addClass("active"); //добавляем класс текущей (нажатой)
        var id =$(this).attr('id');
        var main=$("#activeOrder"),
            preorder=$("#preOrder"),
            history=$("#historyOrder"),
            black=$("#bl"),
            finish=$("#finishOrder");

        switch (id) {
            case "active_tab":
                console.log(id);
                $(preorder).removeClass("active");
                $(finish).removeClass("active");
                $(history).removeClass("active");
                $(black).removeClass("active");
                $(main).addClass("active");
                break;
            case "preorder_tab":
                console.log(id);
                $(main).removeClass("active");
                $(finish).removeClass("active");
                $(history).removeClass("active");
                $(black).removeClass("active");
                $(preorder).addClass("active");
                break;
            case "history_tab":
                $(main).removeClass("active");
                $(finish).removeClass("active");
                $(preorder).removeClass("active");
                $(black).removeClass("active");
                $(history).addClass("active");
                $('input[name=RG1][value=1]').prop("checked", "checked");
                break;
            case "black_tab":
                $(main).removeClass("active");
                $(finish).removeClass("active");
                $(history).removeClass("active");
                $(preorder).removeClass("active");
                $(black).addClass("active");
                break;
            case "done_tab":
                console.log(id);
                $(main).removeClass("active");
                $(preorder).removeClass("active");
                $(history).removeClass("active");
                $(black).removeClass("active");
                $(finish).addClass("active");
                break;
        }
     //   buildOrdersTable();  //заполняем таблицу заказов в зависимости от статуса
    });

/// фильтрация в таблице по нескольким полям
$(document).ready(function(){
    $('.btn-filter').click(function(){
        var $panel = $('.filterable'),
            $filters = $panel.find('.filters input'),
            $tbody = $panel.find('.table tbody');
        if ($filters.prop('disabled') == true) {
            $filters.prop('disabled', false);
            $filters.first().focus();
        } else {
            $filters.val('').prop('disabled', true);
            $tbody.find('.no-result').remove();
            $tbody.find('tr').show();
        }
    });

    $('.filters input').keyup(function(e){
        // Ignore tab key /
        var code = e.keyCode || e.which;
        if (code == '9') return;
        // Useful DOM data and selectors /
        var $panel = $('.filterable'),
            $table = $('.table'),
            $rows = $(this).parents('.filterable').find('tr.table-operator__row'),
            //$rows2 = $('tr.table-operator__row'),
            $input = $(this),

           // inputContent = $input.val().toLowerCase(),
            $columns =$(this).parents('.filters').find('input');
        //console.log($(this).parents('.filterable').find('tr.table-operator__row'));
        var inputContent1= $columns.eq(0).val().toLowerCase(),
            inputContent2= $columns.eq(1).val().toLowerCase(),
            inputContent3= $columns.eq(2).val().toLowerCase(),
            inputContent4= $columns.eq(3).val().toLowerCase(),
            inputContent5= $columns.eq(4).val().toLowerCase(),
            inputContent6= $columns.eq(5).val().toLowerCase(),
            inputContent7= $columns.eq(6).val().toLowerCase(),
            inputContent8= $columns.eq(7).val().toLowerCase(),
            inputContent9= $columns.eq(8).val().toLowerCase(),
            inputContent10= $columns.eq(9).val().toLowerCase();
        column = $('.filters th').index($input.parents('th')) ;

        var $filteredRows = $rows.filter(function(){
            var value1 = $(this).find('td').eq(0).text().toLowerCase(),
                value2 = $(this).find('td').eq(1).text().toLowerCase(),
                value3 = $(this).find('td').eq(2).text().toLowerCase(),
                value4 = $(this).find('td').eq(3).text().toLowerCase(),
                value5 = $(this).find('td').eq(4).text().toLowerCase(),
                value6 = $(this).find('td').eq(5).text().toLowerCase(),
                value7 = $(this).find('td').eq(6).text().toLowerCase(),
                value8 = $(this).find('td').eq(7).text().toLowerCase(),
                value9 = $(this).find('td').eq(8).text().toLowerCase(),
                value10 = $(this).find('td').eq(9).text().toLowerCase();

            if ((value1.indexOf(inputContent1) === -1 )||
                (value2.indexOf(inputContent2) === -1 )||
                (value3.indexOf(inputContent3) === -1 )||
                (value4.indexOf(inputContent4) === -1 )||
                (value5.indexOf(inputContent5) === -1 )||
                (value6.indexOf(inputContent6) === -1 )||
                (value7.indexOf(inputContent7) === -1 )||
                (value8.indexOf(inputContent8) === -1 )||
                (value9.indexOf(inputContent9) === -1 )||
                (value10.indexOf(inputContent10) === -1 )) {
                  return true};   // $row.filter
        });

        // Clean previous no-result if exist /
        $table.find('tbody .no-result').remove();
        //отображает все строки, закрывает все слайды, убирает выделения, скрывает отфтльтрованные
        $rows.show();
        $(".table-operator__spoiler-content").collapse('hide');
        $filteredRows.hide();
        // Prepend no-result row if all rows are filtered /
        if ($filteredRows.length === $rows.length) {
            $table.find('tbody').prepend($('<tr class="no-result text-center"><td colspan="'+ $table.find('.filters th').length +'">No result found</td></tr>'));
        }
    });
});

/// заполнение полей оператора
function setupSessionInfo() {
    $(document).ready(function () {
        $("#name_role").html(SessionInfo1.RoleName);
        $("#fio").html(SessionInfo1.SurName + ' ' + SessionInfo1.FirstName);
        $("#fio1").html(SessionInfo1.SurName + ' ' + SessionInfo1.FirstName);
        $("#horse_m").html(user_stat.WorkHours);
        $("#time_acceptance_order").html(user_stat.TimeGetMedium);
        $("#rating").html(user_stat.Rating);
        $("#award").html(user_stat.BalansMinus);
        $("#balance").html(user_stat.Balans);
        //if  ($( '.delivery_met .active a' ).html() === 'Навынос') $( '#take_away_address' ).show();
        //else $( '#take_away_address' ).hide();
        $(".client_name_oper").html($("#client_name").val());
        $("#client .h3").html('Япоки, оператор ' + SessionInfo1.FirstName + ', здраствуйте!');
        if ($('.delivery_met.active a').html() === 'Навынос')
            $(".delivery_name").html("приготовлен");
        else $(".delivery_name").html("доставлен");
    });
}
setupSessionInfo();


///заказ-корзина-----------------------------------------------------------

//TODO добавляет адреса организации самовывоза по клику на селект
function addOrgToPage(){
    $( '#take_away_address' ).empty();
    $( '#take_away_address2' ).empty();
    for (var i=0; i<Organizations.length; i++)
        $( '#take_away_address, #take_away_address2' ).append('<option value="'+i+'">'+Organizations[i].Street+ ', '+Organizations[i].House+'</option>');
}
/*$( document ).on(click, '#take_away_address',function () {
    $( '#take_away_address' ).empty();
    for (var i=0; i<Organizations.length; i++)
        $( '#take_away_address' ).append('<option value="'+i+'">'+Organizations[i].Address+'</option>');
});*/

$('#loadtel').on ('click', function(){
    //getorderuserbyPhone( getNumber ( $("#client_phone").attr('id'))); //результат запускает  reloadClientTel()
    getClientInfo(getNumber ( $("#client_phone").attr('id')));
    getClientAddress(getNumber ( $("#client_phone").attr('id')));
});

$('#loadtel2').on ('click', function(){
    //getorderuserbyPhone( getNumber ( $("#client_phone").attr('id'))); //результат запускает  reloadClientTel()
    console.log(setPeriod($('input[name=RG1]:checked').val()));
    getordersbyphone( getNumber ( $("#client_phone2").attr('id')),setPeriod($('input[name=RG1]:checked').val()),getTimeOnNow(),50,0);
});

function orderTimer() {
   // $("#tbody1 [id*='first_stat_minus']").ready(function () {
       $.each( $("#tbody1 [id*='first_stat_minus']"), function (key, timer) {
            $(timer).text(timePlus1 ($(timer).text(),1));
       });
   // });
}


/// добавление адреса клиента по номеру телефона по клику кнопки загрузить

function reloadClientTel(){
//TODO добавить обновление города и имени  #city_client #client_name
    console.log('telinfo');
    var newaddress={};
    //$(document).ready(function () {
    $("#accordion1").empty();
    //});
    var digit={1:"One",2:"Two",3:"Three"};
    var count=1;

    var newaddress1='<div class="panel"> <div class="panel-heading" role="tab" id="heading'+digit[count]+'">'+
        '<a role="button" data-toggle="collapse" data-parent="#accordion1" href="#collapse'+digit[count]+'" aria-expanded="false" aria-controls="collapse'+digit[count]+'">'+
        'Новый адрес </a> </div>'+
        '<div id="collapse'+digit[count]+'" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading'+digit[count]+'">'+
        '<div class="panel-body">'+
        '<input id="street_client" class="col-sm-12 typeahead" type="text" placeholder="Введите адрес" value="">'+
        '<div class="row">'+
        '<label class="col-sm-4" for="home_number">Дом <input id="home_number" type="text"></label>'+
        '<label class="col-sm-4" for="corp_str">Корп./Стр. <input id="corp_str" type="text"></label>'+
        '<label class="col-sm-4" for="kv_of">Кв./Оф. <input id="kv_of" type="text"></label>'+
        '</div>'+
        '<div class="row">'+
        '<label class="col-sm-4" for="podyezd">Подъезд <input id="podyezd" type="text"></label>'+
        '<label class="col-sm-4" for="level">Этаж <input id="level" type="text"></label>'+
        '<label class="col-sm-4" for="cod">Код <input id="cod" type="text"></label>'+
        '</div> </div> </div>  </div>';

    $("#accordion1").append(newaddress1);

    for (var i=1;i<=telinfo.count;i++) {//if (i=="count") continue;
        newaddress[i] =
                      '<div class="panel"> <div class="panel-heading" role="tab" id="heading' + 1 + i + '">' +
            '  <a class="collapsed" role="button" data-toggle="collapse" data-parent="#accordion1"' +
            ' href="#collapse' +  1 + i + '" aria-expanded="false" aria-controls="collapse' +  1 + i + '">' +
            ' '+telinfo[i].Street+' д. '+telinfo[i].House+' '+((telinfo[i].Building>0)?telinfo[i].Building:"")+', кв. '+telinfo[i].Apartment+' '+
            '</a> </div>' +
            '<div id="collapse' +  1 + i + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading' +  1 + i + '">' +
            '<div class="panel-body">' +
            '<input id="street_client" class="col-sm-12 typeahead" type="text" placeholder="Введите адрес" value="' + telinfo[i].Street + '">' +
            '<div class="row">' +
            '<label class="col-sm-4" for="home_number">Дом <input id="home_number" type="text" value="'+telinfo[i].House+'"></label>' +
            '<label class="col-sm-4" for="corp_str">Корп./Стр. <input id="corp_str" type="text" value="'+telinfo[i].Building+'"></label>' +
            '<label class="col-sm-4" for="kv_of">Кв./Оф. <input id="kv_of" type="text" value="'+telinfo[i].Apartment+'"></label>' +
            '</div>' +
            '<div class="row">' +
            '<label class="col-sm-4" for="podyezd">Подъезд <input id="podyezd" value="'+telinfo[i].Entrance+'" type="text"></label>' +
            '<label class="col-sm-4" for="level">Этаж <input id="level" type="text" value="'+telinfo[i].Floor+'"></label>' +
            '<label class="col-sm-4" for="cod">Код <input id="cod" value="'+telinfo[i].DoorphoneCode+'" type="text"></label>' +
            '</div> <div class="pull-right">' +
            '<input type="checkbox" id="domofon"><label for="domofon">Домофон</label>' +
            '</div> </div> </div> </div>';

        $("#accordion1").append(newaddress[i]);

    }
    $ (document).ready(function(){
        //проверка адреса доставки при изменении
        $(".operator_client_adress .collapse #street_client, .operator_client_adress .collapse #home_number").change( function () {

            if  ($( '.delivery_met.active a' ).first().html() === 'Доставка')
                getDeliveryZone(
                    $("#city_client").val(),
                    $(".operator_client_adress .collapse.in #street_client").val(),
                    $(".operator_client_adress .collapse.in #home_number").val());
        });
        $(".operator_client_adress").find(".panel-heading").on("click",function(){
            if  ($( '.delivery_met.active a' ).first().html() === 'Доставка')
                //console.log(this);
                getDeliveryZone(
                    $("#city_client").val(),
                    $(this).next().find("#street_client").val(),
                    $(this).next().find("#home_number").val());
        });
        //автоподстановка адреса
        $('.operator_client_adress .collapse #street_client').typeahead({
                hint: false, highlight: true, minLength: 1
            },
            {
                name: 'Street',
                source: substringMatcher(typeaheadStreet)
            });
    });
}


//---------- приготовить сдачу
$(".money_summ a").click(function (event) {$("#ostatok").val(this.text); });
$('#ostatok').next().click(function () {$("#ostatok").val(""); });


/// изменение имени на странице заказа
$(document).ready(function(){
    $("#client_name, #client_name2").keyup(function() {
        var $input = $(this);
        phone_client_name= $input.val();
        $(".client_name_oper").html(phone_client_name);
    })
});

/// очистка свойства элементов корзины
$('#products_cat li').click(function () {
    $('#products_cat li').removeClass('active')
});

///очистка поля перед кнопкой очистить
$(".clearbutton").on('click',function(){
    $(this).prev().val("");
});


// заказ клиента на след страницу
$('#next_btn').click(function () {
    if($("#take_away_address option:selected").index()<0) {alert("Выберите адрес самовывоза/доставки"); return;}
    if (($(".operator_client_adress .collapse.in").length)==0&&( $( '.delivery_met.active a' ).html()) === 'Доставка')
        {alert("Не выбран адрес клиента"); return;}
    //if (!($(".operator_client_adress .collapse.in").val())){alert("Не заполнена улица в адресе клиента"); return;}
        $('#tab_client').removeClass("active");
        $('#client').removeClass("active");
        $('#tab_order').addClass("active");
        $('#order_client').addClass("active");
});

///нажатие кнопки открытия корзины на панели нового заказа
$("#cart_btn").on('click',function(){ //  в меню(корзину)
    $(".operator").hide();
    $("#new_div_tab").hide();
    $("#new_div_tab2").hide();
    $("#page_cart").show();
    $(".trigger").hide();
    getPromo();
    $(document).ready(function () {
        if($("#take_away_address option:selected").index()>=0)  getproductOrg();
    })
});
$("#cart_btn2").on('click',function(){ //  в меню(корзину)
    $(".operator").hide();
    $("#new_div_tab").hide();
    $("#new_div_tab2").hide();
    $("#page_cart").show();
    $(".trigger").hide();
    $(document).ready(function () {
        if($("#take_away_address option:selected").index()>=0)  getproductOrg();
    })
});

// отмена создания заказа переход из заказа клиента на главную страницу оператора
$("#cancel_btn,#cancel_btn222").on('click',function(){
    $("#main_div_tab").show();
    $("#new_div_tab").hide();
    $("#new_div_tab2").hide();
    $("#active_tab").click();                         //запускаем вкладку активные заказы
    $('#tab_order').removeClass("active");
    $('#order_client').removeClass("active");
    $('#tab_client').addClass("active");
    $('#client').addClass("active");
});

$("#cancel_btn22,#cancel_btn2").on('click',function(){
    $("#main_div_tab").show();
    $("#new_div_tab").hide();
    $("#new_div_tab2").hide();
    $("#active_tab").click();                         //запускаем вкладку активные заказы
    $('#tab_order').removeClass("active");
    $('#order_client').removeClass("active");
    $('#tab_client').addClass("active");
    $('#client').addClass("active");
});
// создание заказа, переход  на главную страницу оператора
$("#finish_btn").on('click',function(){
    if($("#take_away_address option:selected").index()<0) {alert("Выберите адрес самовывоза/доставки"); return;}
    if (($(".operator_client_adress .collapse.in").length)==0
        &&$(".delivery_met.active a").html()=="Доставка"){alert("Не выбран адрес клиента"); return;}
    if (Cart.list .length==0){alert("Корзина пуста"); return;}

    var orders_cart=Cart.getCart();
    console.log(orders_cart);
    var ordd={};
    ordd.type = $(".delivery_met.active a").html();//=="Доставка")?1:2,
    //status= ($("#on_time").is(":checked"))?"Предзаказ": "Принят",
    ordd.time_delivery = ($("#on_time").is(":checked")) ? getTimeOnTime() : "0001-01-01T00:00:00Z";  //getTimeNowGo()
    ordd.datepreordercook = ($("#on_time").is(":checked")) ? getTimeOnTime() : "0001-01-01T00:00:00Z";
    ordd.org_index = $("#take_away_address option:selected").index();
    ordd.hash_org = Organizations[ ordd.org_index].Hash;
    ordd.countperson = $("#count_person_span").text();
    ordd.division = ($("#to_workers").is(":checked")) ? $("#input_to_workers").val():" ";
    ordd.bonus = "1";
    ordd.pricecart = Cart.getPrice(true); //true без скидки   return [Math.round(price), discount, discountPercent]
    ordd.pricecart1 = Cart.getPrice();
    ordd.price =  ordd.pricecart1[0];
    ordd.pricedisc = ordd.pricecart1[3];
    ordd.discontname = ordd.pricecart1[1];//(type=="Навынос")? "навынос":"", //pricecart[1]
    ordd.discontperc = ordd.pricecart1[2];//(type=="Навынос")?10:0,  //pricecart[1]
    ordd.price_currency = "руб.";
    ordd.NameStorage = Organizations[ ordd.org_index].NameSklad;
    ordd.note = ($("#ostatok").val() == "") ? "" : "Приготовить сдачу с " + $("#ostatok").val() + "<br> ";
   // ordd.note += ($("#to_workers").is(":checked")) ? ( "Обед сотрудника -  " + $("#input_to_workers").val() + "<br> ") : " ";
    ordd.note += $("#comment_order2").val();
    ordd.TypePayments=($("ul.pay_met .active a").html()=="Наличными")?1:2;
    neworder(ordd);// отправить  заказ на сервер

    $("#main_div_tab").show();
    $("#new_div_tab").hide();
    $("#new_div_tab2").hide();
    $("#active_tab").click();                         //запускаем вкладку активные заказы
    $('#tab_order').removeClass("active");
    $('#order_client').removeClass("active");
    $('#tab_client').addClass("active");
    $('#client').addClass("active");

});

// из  корзины (меню) на страницу оформления заказа
$("#cart_btn_cancel , #cart_btn_apply").on('click',function(){
    $("#page_cart").hide();
    $("#main_div_tab").hide();
    $(".operator").show();
    $("#new_div_tab").show();
    //$("#new_div_tab2").show();
    $("#overall_cost").html($("#over_price").html());
    $(".operator").show();
});

$("#over_price").on("change", function () {
    $("#overall_cost").html($("#over_price").html());
});

function textVal(text){
    if (text=="Undefined"||text=="undefined"||!text) return " ";
    return text;
};


function addDiscountToPage(){
    $( '#promo_discount' ).empty();
    for (var i=0; i<Discounts.length; i++)
        $( '#promo_discount' ).append('<option value="'+i+'">'+Discounts[i].discount_name+'</option>');
}

var Discounts=[
    {discount_percent:0,discount_name:"Выберите скидку"},
    {discount_percent:10,discount_name:"Навынос"},
    {discount_percent:15,discount_name:"День рождения"}
];

//загружаем адреса доставки по изменению поля город
$("#city_client").change ( function () {
    getOrg($("#city_client").val());
});

$( document ).on( 'click', '#to_workers', function () {
    var s = $( '#input_to_workers' );
    s.css( 'display', ( $( this ).prop( 'checked' ) ? '' : 'none') );
    Cart.showPrice()
} );

$(document).on("click",".editOrder", function(){
    var id=$(this).parents(".table-operator__spoiler-content").attr('id');
    id=id.slice(3);
    for (var i=0; i<Organizations.length; i++)  if (orders[id].OrgHash==Organizations[i].Hash)   break;
    $("#client_name2").val(orders[id].NameCustomer);
    $("#client_phone_2").val(orders[id].Phone);
    // $("#take_away_address2").selectedIndex
     $("#accordion2").find("a").html(orders[id].Street+' д. '+orders[id].House+' '+((orders[id].Building>0)?orders[id].Building:"")+', кв. '+orders[id].Apartment);
     $("#comment_order_2").val(orders[id].NoteUser);
     $("#comment_order_22").val(orders[id].Note);
    //

    $("#street_client_edit").val(orders[id].Street);
    $("#home_number_edit").val(orders[id].House);
    $("#corp_str_edit").val(orders[id].Building);
    $("#kv_of_edit").val(orders[id].Apartment);
    $("#podyezd_edit").val(orders[id].Entrance);
    $("#level_edit").val(orders[id].Floor);
    $("#cod_edit").val(orders[id].DoorphoneCode);

    $("#main_div_tab").hide();
    $("#new_div_tab2").show();
    Cart.clean();
    for(var j in orders[id].orderlist)
    if (orders[id].orderlist[j].ID_parent_item == 0) {
        console.log("111111");
        Product.setCountCart(orders[id].orderlist[j].Price_id, orders[id].orderlist[j].Price_id, +1);
    }
    Cart.showPrice();
    // $("#tab_client2").click();

    console.log(id);
});

$( document ).on( 'click', '#ignore_delivery', function () {
    if ($("#ignore_delivery").is(":checked"))
        for (var i=0;i<Organizations.length;i++)
            $( '#take_away_address option[value='+i+']' ).prop('disabled', '');
    else if ($( '.delivery_met.active a' ).first().html() === 'Доставка')
                getDeliveryZone(
                    $("#city_client").val(),
                    $(".operator_client_adress .collapse.in #street_client").val(),
                    $(".operator_client_adress .collapse.in #home_number").val());
} );

function delivery_zone(){

//    $("#take_away_address option:selected").index(),
}

$ (document).ready(function(){
    //проверка адреса доставки при изменении
    $(".operator_client_adress .collapse #street_client, .operator_client_adress .collapse #home_number").change( function () {

        if  ($( '.delivery_met.active a' ).first().html() === 'Доставка')
            getDeliveryZone(
                $("#city_client").val(),
                $(".operator_client_adress .collapse.in #street_client").val(),
                $(".operator_client_adress .collapse.in #home_number").val());
    });
    $(".operator_client_adress").find(".panel-heading").on("click",function(){
        if  ($( '.delivery_met.active a' ).first().html() === 'Доставка')
        //console.log(this);
            getDeliveryZone(
                $("#city_client").val(),
                $(this).next().find("#street_client").val(),
                $(this).next().find("#home_number").val());
    });
    //автоподстановка адреса
    $('.operator_client_adress .collapse #street_client').typeahead({
            hint: false, highlight: true, minLength: 1
        },
        {
            name: 'Street',
            source: substringMatcher(typeaheadStreet)
        });
});


length = function ( obj ) {
    var len = 0, i;
    for ( i in obj ) {
        len++;
    }
    return len;
};

function counter( val ) {
    var count = val || -1;
    return function () {
        return ++count;
    };
}

var substringMatcher = function(strs) {
    return function findMatches(q, cb) {
        var matches, substrRegex;
        matches = [];
        substrRegex = new RegExp(q, 'i');
        $.each(strs, function(i, str) {
            if (substrRegex.test(str)) matches.push(str);
        });

        cb(matches);
    };
};

var typeaheadStreet = [
    '1-й микрорайон',
    'микрорайон 1а',
    '2-й микрорайон',
    '3-й микрорайон',
    '4-й микрорайон',
    '5-й микрорайон',
    '6-й микрорайон',
    'микрорайон 6а',
    '7-й микрорайон',
    '11-й микрорайон',
    '16-й микрорайон',
    '1 Мая',
    '2351',
    '8 Марта',
    '8 Райсъезда',
    '9 Мая',
    '9 Января',
    'Авиационная',
    'Автозаводская 1-я',
    'Автозаводская 2-я',
    'Автозаводская',
    'Агрономическая',
    'Акмолинская',
    'Алексеева',
    'Алябьева',
    'Анфиногенова',
    'Арбинская',
    'Аргентовского',
    'Артема',
    'Аэропорт',
    'Бажова',
    'Баумана',
    'Башняговского',
    'Бедного',
    'Демьяна Бедного',
    'Белинского',
    'Березовая',
    'Березовая',
    'Библиотечный переулок',
    'Блюхера',
    'Василия Блюхера',
    'Больничная 4-я',
    'Больничная 5-я',
    'Больничная 6-я',
    'Больничная 7-я',
    'Больничная 9-я',
    'Больничная 10-я',
    'Боровлянский переулок',
    'Бородина',
    'Бошняковская',
    'Братская',
    'Булавина',
    'Бурова-Петрова',
    'Вагонная',
    'Варгашинский переулок',
    'Васильева',
    'Ватутина',
    'Введенский переулок',
    'Витебского',
    'Вишневая',
    'Войкова',
    'Володарского',
    'Встречный переулок',
    'Выгонная',
    'Высоковольтный переулок',
    'Гагарина',
    'Гайдара',
    'Галкинская',
    'Галкинский переезд',
    'Гаражная',
    'Гастелло',
    'Гвардейская',
    'Гвардейский переулок',
    'Герцена',
    'Глинки',
    'Глинская',
    'Гоголя',
    'Голикова проспект',
    'Гончарова',
    'Городской сад парк',
    'Горького',
    'Горяева',
    'Грибоедова',
    'Гризодубовой',
    'Грицевца',
    'Громовой',
    'Губанова',
    'Дальний переулок',
    'Дамбовая',
    'Дачный переулок',
    'Декабристов',
    'Джамбула',
    'Дзержинского переулок',
    'Дзержинского',
    'Димитрова',
    'Добролюбова',
    'Доватора',
    'Докучаева',
    'Дома Кургансельмаша',
    'Дома Мелькомбината',
    'Дома МСУ',
    'Донского',
    'Достоевского',
    'Дружбы',
    'Дундича',
    'Епишева',
    'Ермака',
    'Жданова',
    'Железнодорожный переулок',
    'Жуковского',
    'Заводская 1-я',
    'Загорная',
    'Загородный переулок',
    'Зайковский переулок',
    'Зайцева',
    'Западный переулок',
    'Заречная',
    'Заслонова',
    'Затобольный переулок',
    'Зауральская',
    'Зеленая',
    'Зеленый переулок',
    'Земнухова',
    'Зорге',
    'Иковский переулок',
    'Илизарова',
    'Интернатовская',
    'Интернациональная',
    'Ипподромная',
    'Иртышская',
    'Исетская',
    'Калашниковское торфопредприятие',
    'Калинина',
    'Карбышева',
    'Карельцева',
    'Катайский переулок',
    'Керамическая',
    'Кетовский переулок',
    'Кирова',
    'Кирпичная',
    'Климова',
    'Колхозная',
    'Кольцевая',
    'Комиссаров',
    'Коммунальная',
    'Комсомольская',
    'Конституции проспект',
    'Кооперативная',
    'Короленко',
    'Косая',
    'Космодемьянской',
    'Зои Космодемьянской',
    'Космонавтов',
    'Кособродский переулок',
    'Котовского',
    'Кошевого',
    'Кравченко',
    'Красина',
    'Краснодонская',
    'Красномаячная',
    'Красномаячный переулок',
    'Кремлева',
    'Криволапова',
    'Крупской',
    'Крутикова',
    'Крылова',
    'Кузнецова',
    'Куйбышева переулок',
    'Куйбышева',
    'Кулибина',
    'Культурный переулок',
    'Куприна',
    'Курганская',
    'Куртамышская',
    'Кустанайская',
    'Ладыгина',
    'Лазо',
    'Ленина',
    'Ленинградская',
    'Лермонтова',
    'Лескова',
    'Лесопарковая',
    'Линейная',
    'Локомотивная',
    'Ломоносова',
    'Луговая',
    'Луначарского',
    'Майкова',
    'Макаренко',
    'Малая Южная',
    'Малиновский переулок',
    'Малиновского',
    'Малочаусовский переулок',
    'Мальцева',
    'Мамина-Сибиряка',
    'Маркса',
    'Карла Маркса',
    'Матросова',
    'Машиностроителей переулок',
    'Машиностроителей проспект',
    'Маяковского',
    'Маячная 1-я',
    'Маячная 2-я',
    'Маячная',
    'Межевая 1-я',
    'Межевая 2-я',
    'Мелькомбинат',
    'Менделеева',
    'Мечникова',
    'Мира бульвар',
    'Мичурина',
    'Молодежи парк',
    'Молодежи переулок',
    'Молодежи',
    'Молодой Гвардии',
    'Монтажников',
    'Московская',
    'Мост Тобол',
    'Мостовая',
    'Мостопоезд',
    'Мостостроителей',
    'Мусоргского',
    'Мяготина',
    'Коли Мяготина',
    'Набережная',
    'Нагорная',
    'Нагорный переулок',
    'Нахимова',
    'Невежина',
    'Невского',
    'Некрасова',
    'Нефтебаза',
    'Новаторов',
    'Новая',
    'Новогалкинская',
    'Новоселов',
    'Новостроек',
    'Овражная',
    'Огарева',
    'Огинского',
    'Огородная',
    'Огородный переулок',
    'Односторонка 1-я',
    'Односторонка 2-я',
    'Односторонка',
    'Одоевского',
    'Озерная',
    'Октябрьская',
    'Олимпийская',
    'Омская',
    'Омский переулок',
    'Орджоникидзе',
    'Орлова',
    'Осипенко',
    'Островского',
    'Отдыха',
    'Откормсовхоз',
    'Павлова',
    'Панфилова',
    'Парижской Коммуны',
    'Партизанская',
    'Пархоменко',
    'Первомайский переулок',
    'Перова',
    'Пестеля',
    'Песчаная',
    'Песчаный переулок',
    'Петропавловская',
    'Пионерская',
    'Пирогова',
    'Пичугина',
    'Плеханова',
    'Плодопитомник',
    'Победы',
    'Пограничная',
    'Полевая площадь Полевая',
    'Ползунова',
    'Половинская',
    'Полярная',
    'Попова переулок',
    'Попова',
    'Почтовая',
    'Правды',
    'Прибрежная',
    'Пригородная',
    'Пролетарская',
    'Промышленная',
    'Просветский переулок',
    'Профсоюзная',
    'Проходная',
    'Птицефабрика',
    'Пугачева',
    'Пурица',
    'Пушкина',
    'Рабоче-Крестьянская',
    'Рабочий переулок',
    'Радиомаяк',
    'Радионова',
    'Радищева',
    'Радужный переулок',
    'Разина',
    'Репина',
    'Репниных',
    'Родниковая',
    'Родькина',
    'Рубинштейна',
    'Рылеева',
    'Рябиновая',
    'Рябковская',
    'Савельева',
    'Савельевский переезд',
    'Садовая',
    'Садовый переулок',
    'Сады Зауралья',
    'Саратовский переулок',
    'Свердлова',
    'Свободы',
    'Сельская',
    'Серова',
    'Сеченова',
    'Сибирская',
    'Слосмана площадь',
    'Смирнова',
    'СМП-290',
    'Советская',
    'Совхозный переулок',
    'Солнечная',
    'Солнечный бульвар',
    'Союзная',
    'Спартака переулок',
    'Спартака',
    'Спортивная',
    'Спортивный переулок',
    'Стальского',
    'Станционная',
    'Строительный переулок',
    'Стройбаза',
    'Суворова',
    'Сурикова',
    'Сусанина',
    'Сухэ-Батора',
    'Тельмана',
    'Тепловозная',
    'Техническая',
    'Тимирязева',
    'Тобольная',
    'Товарная',
    'Томина',
    'Томская',
    'Торфопредприятие',
    'Трактовая 1-я',
    'Трактовая 2-я',
    'Тропинина',
    'Тургенева переулок',
    'Тюленина',
    'Тюменская',
    'Тютчева',
    'Увальская',
    'Ульяновой',
    'Марии Ульяновой',
    'Уральская',
    'Урицкого',
    'Урожайная',
    'Уфимская',
    'Ушакова',
    'Февральская',
    'Фестивальная',
    'Филатова',
    'Фрунзе',
    'Фурманова',
    'Хабаровская',
    'Халтурина',
    'Химмашевская',
    'Хмельницкого',
    'Цвиллинга',
    'Целинная',
    'Центральная',
    'Центральная',
    'Центральная',
    'Цеткин',
    'Циолковского',
    'ЦПКиО парк',
    'Чайковского',
    'Чапаева',
    'Часовая 2-я',
    'Часовая',
    'Чаусовская',
    'Чашинский переулок',
    'Челюскинцев',
    'Челябинская',
    'Черемуховская',
    'Чернореченская',
    'Чернышевского',
    'Черняховского',
    'Чехова',
    'Чистое поле',
    'Чистопрудный переулок',
    'Чистый переулок',
    'Чкалова',
    'Шатровский переулок',
    'Шевелевская',
    'Шевцовой',
    'Шевченко переулок',
    'Шевченко',
    'Широкий переулок',
    'Школьная',
    'Шумана',
    'Щорса',
    'Элеваторный переулок',
    'Электровозная',
    'Энгельса переулок',
    'Энергетическая',
    'Юбилейная',
    'Югова',
    'Южная',
    'Юлаева',
    'Юннатов',
    'Юргамышская',
    'Яблочкина',
    'Ялуторовская',
    'Ястржембского'
];



// var date =$("#select_date").val(),
//     time=$("#select_time").val();
