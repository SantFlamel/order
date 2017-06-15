package postgres

import (
	"database/sql"
	"errors"
	_ "github.com/lib/pq"
	"log"
	"project/order/conf"
	"sync"
)

var DB *sql.DB
var Requests DBRequests

type DBRequests struct {
	rlock        *sync.RWMutex
	RequestsList map[string]*sql.Stmt
}

func (dbr *DBRequests) InitDatabaseRequests() error {
	dbr.rlock = &sync.RWMutex{}
	dbr.rlock.Lock()
	defer dbr.rlock.Unlock()

	dbr.RequestsList = make(map[string]*sql.Stmt)
	var err error
	//==================================================================================================================
	//==================================================================================================================
	//----ORDER----//

	//----CREATE_ORDER
	//dbr.RequestsList["execInsertOrder"], err = DB.Prepare("INSERT INTO \"order\"( " +
	//        "side_order, time_delivery, date_preorder_cook, name_customer, " +
	//        "phone, address, count_person, division, org_hash, note, discount_name, " +
	//        "discount_percent, bonus, type, \"Changed\", " +
	//        "price, price_with_discount, price_currency) " +
	//        "VALUES ($1, $2, $3, $4, " +
	//        "$5, $6, $7, $8, $9, $10, $11, " +
	//        " $12, $13, $14, true, $15, $16, $17)")
	//if err!=nil{return err}
	//----CREATE_ORDER_RETURN_ID
	dbr.RequestsList["execInsertOrderGetID"], err = DB.Prepare("INSERT INTO \"order\"( " +
		"side_order, time_delivery, date_preorder_cook, " +
		"count_person, division, name_storage, org_hash, note, discount_name, " +
		"discount_percent, bonus, type, \"Changed\", " +
		"price, price_with_discount, price_currency, type_payments, order_time, paid_off) " +
		"VALUES ($1, $2, $3, $4, " +
		"$5, $6, $7, $8, $9, $10, $11, $12, " +
		"true, $13, $14, $15, $16, $17, $18) RETURNING id")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----UPDATE_PRICE
	dbr.RequestsList["execUpdateOrderPrice"], err = DB.Prepare("UPDATE \"order\" SET price=$2, price_with_discount=$3, price_currency=$4, \"Changed\"=true WHERE id=$1")
	if err != nil {
		return err
	}

	//----UPDATE_DATE_PRE_ORDER_COOK
	dbr.RequestsList["execUpdateOrderDatePreOrderCook"], err = DB.Prepare("UPDATE \"order\" SET time_delivery=$2, date_preorder_cook=$3,  \"Changed\"=true WHERE id=$1")
	if err != nil {
		return err
	}

	//----UPDATE_DISCOUNT
	dbr.RequestsList["execUpdateOrderDiscount"], err = DB.Prepare("UPDATE \"order\" SET discount_name=$2, discount_percent=$3, \"Changed\"=true WHERE id=$1")
	if err != nil {
		return err
	}

	//----UPDATE_DISCOUNT
	dbr.RequestsList["execUpdateOrderPaidOff"], err = DB.Prepare("UPDATE \"order\" SET paid_off=$2, \"Changed\"=true WHERE id=$1")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadOrderValue"], err = DB.Prepare("" +
		"SELECT id, side_order, time_delivery, date_preorder_cook, " +
		"count_person, division, name_storage, org_hash, note, discount_name, " +
		"discount_percent, bonus, type, " +
		"price, price_with_discount, price_currency, type_payments, order_time, paid_off " +
		"FROM \"order\" WHERE id = $1")
	if err != nil {
		return err
	}

	//----READ_TYPE
	dbr.RequestsList["queryReadOrderValueStringType"], err = DB.Prepare("SELECT type FROM \"order\" WHERE id = $1")
	if err != nil {
		return err
	}

	//----READ_ORG_HASH
	dbr.RequestsList["queryReadOrderValueStringOrgHash"], err = DB.Prepare("SELECT org_hash FROM \"order\" WHERE id = $1")
	if err != nil {
		return err
	}

	//----READ_ORG_HASH
	dbr.RequestsList["queryReadOrderValueBooleanPaidOff"], err = DB.Prepare("SELECT paid_off FROM \"order\" WHERE id = $1")
	if err != nil {
		return err
	}

	//----READ_COUNT_ALL
	dbr.RequestsList["queryReadOrderCheckInfo"], err = DB.Prepare("select org_hash,discount_name,\"type\",note, (SELECT order_customer.note FROM order_customer WHERE order_id = id),discount_percent,price,price_with_discount,price_currency from \"order\" where id=$1;")
	if err != nil {
		return err
	}

	//----READ_FOR_CHECK
	dbr.RequestsList["queryReadOrderValueNumberCountAll"], err = DB.Prepare("SELECT count(*) FROM \"order\"")
	if err != nil {
		return err
	}

	//--------------------------------------RANGE
	//----READ_RANGE_TYPE
	dbr.RequestsList["queryReadOrderRangeType"], err = DB.Prepare("" +
		"SELECT id, side_order, time_delivery, date_preorder_cook, " +
		"count_person, division, name_storage, org_hash, note, discount_name, " +
		"discount_percent, bonus, type, " +
		"price, price_with_discount, price_currency, type_payments, order_time, paid_off " +
		"FROM \"order\" WHERE type = $1 ORDER BY id ASC LIMIT $2  OFFSET $3")
	if err != nil {
		return err
	}

	//----READ_RANGE_TYPE
	dbr.RequestsList["queryReadOrderRangeByUserHashCollect"], err = DB.Prepare("" +
		"WITH s AS( " +
		"SELECT \"order\".*  " +
		",(SELECT status_id FROM order_status WHERE order_id=\"order\".id ORDER BY \"time\" desc LIMIT 1) AS osl " +
		",(SELECT count(*) FROM order_personal WHERE order_id=\"order\".id AND user_hash=$1) AS op " +
		"FROM \"order\" ) " +
		"SELECT id, side_order, time_delivery, date_preorder_cook, count_person, " +
		"division, name_storage, org_hash, note, discount_name, discount_percent, " +
		"bonus, type, price, price_with_discount, price_currency, type_payments, order_time, paid_off " +
		"FROM s WHERE s.op > 0 AND osl > 8 AND osl < 11 ORDER BY id ASC LIMIT $2  OFFSET $3")
	if err != nil {
		return err
	}

	//----READ_RANGE_org_hash
	dbr.RequestsList["queryReadOrderRangeOrgHash"], err = DB.Prepare("" +
		"select  id, side_order, time_delivery, date_preorder_cook, " +
		"count_person, division, name_storage, org_hash, note, discount_name, " +
		"discount_percent, bonus, type, " +
		"price, price_with_discount, price_currency, type_payments, order_time, paid_off  from \"order\" " +
		"where  " +
		"org_hash = $1 AND " +
		"order_time > $2 AND " +
		"order_time < $3 " +
		"ORDER BY id ASC LIMIT $4  OFFSET $5")
	if err != nil {
		return err
	}

	//----READ_RANGE
	dbr.RequestsList["queryReadOrderRange"], err = DB.Prepare("" +
		"SELECT id, side_order, time_delivery, date_preorder_cook, " +
		"count_person, division, name_storage, org_hash, note, discount_name, " +
		"discount_percent, bonus, type, " +
		"price, price_with_discount, price_currency, type_payments, order_time, paid_off  FROM " +
		"(SELECT \"order\".*," +
		"(SELECT \"time\" FROM order_status WHERE order_id=\"order\".id ORDER BY time ASC LIMIT 1) AS times " +
		"FROM \"order\") o " +
		"WHERE  " +
		"o.times > $1 AND " +
		"o.times < $2 " +
		"ORDER BY o.id DESC LIMIT $3 OFFSET $4")
	if err != nil {
		return err
	}

	//----READ_RANGE_ASC
	dbr.RequestsList["queryReadOrderRangeASC"], err = DB.Prepare("" +
		"SELECT id, side_order, time_delivery, date_preorder_cook, " +
		"count_person, division, name_storage, org_hash, note, discount_name, " +
		"discount_percent, bonus, type, " +
		"price, price_with_discount, price_currency, type_payments, order_time, paid_off  FROM " +
		"(SELECT \"order\".*," +
		"(SELECT \"time\" FROM order_status WHERE order_id=\"order\".id ORDER BY time ASC LIMIT 1) AS times " +
		"FROM \"order\") o " +
		"WHERE  " +
		"o.times > $1 AND " +
		"o.times < $2 " +
		"ORDER BY o.id ASC LIMIT $3 OFFSET $4")
	if err != nil {
		return err
	}

	//----READ_RANGE
	dbr.RequestsList["queryReadOrderRangeUserHashAndRangeTime"], err = DB.Prepare("" +
		"SELECT o.id, o.side_order, o.time_delivery, o.date_preorder_cook, o.count_person, " +
		"o.division, o.name_storage, o.org_hash, o.note, o.discount_name, o.discount_percent, o.bonus, " +
		"o.type, o.price, o.price_with_discount, o.price_currency, type_payments, order_time, paid_off " +
		"FROM " +
		"(SELECT order_id,\"time\" FROM order_status ORDER BY \"time\" DESC LIMIT 1) os, " +
		"order_personal op " +
		"INNER JOIN \"order\" o ON o.id=order_id " +
		"AND o.id=op.order_id " +
		"WHERE " +
		"op.user_hash=$1 " +
		"AND os.time > $2 " +
		"AND os.time < $3 ")
	if err != nil {
		return err
	}

	//----READ_RANGE_ByPhoneCustomer
	dbr.RequestsList["queryReadOrderRangeByPhoneCustomer"], err = DB.Prepare("" +
		"SELECT id, side_order, time_delivery, date_preorder_cook, " +
		"count_person, division, name_storage, org_hash, note, discount_name, " +
		"discount_percent, bonus, type, " +
		"price, price_with_discount, price_currency, type_payments, order_time, paid_off " +
		"FROM public.\"order\" WHERE order_time>$2 AND order_time<$3  " +
		"AND id in(SELECT order_id FROM order_customer WHERE phone=$1)  LIMIT $4 OFFSET $5;")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----DELETE_ITEM
	dbr.RequestsList["execDeleteOrderItem"], err = DB.Prepare("DELETE FROM \"order\" WHERE id = $1")
	if err != nil {
		return err
	}

	//==================================================================================================================
	//==================================================================================================================
	//----ORDER_CUSTOMER
	dbr.RequestsList["execInsertOrderCustomer"], err = DB.Prepare("INSERT INTO order_customer(order_id, name_customer, phone, note, city, street, house, building, floor, apartment, entrance, doorphone_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----UPDATE_STATUS
	dbr.RequestsList["execUpdateOrderCustomer"], err = DB.Prepare("UPDATE order_customer SET name_customer=$2, phone=$3, note=$4, city=$5, street=$6, house=$7, building=$8, floor=$9, apartment=$10, entrance=$11, doorphone_code=$12 WHERE order_id = $1")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadOrderCustomerValue"], err = DB.Prepare("SELECT order_id, name_customer, phone, note, city, street, house, building, floor, apartment, entrance, doorphone_code FROM order_customer WHERE order_id=$1;")
	if err != nil {
		return err
	}

	//----READ_NOTE
	dbr.RequestsList["queryReadOrderCustomerValueStringNote"], err = DB.Prepare("SELECT note FROM order_customer WHERE order_id = $1;")
	if err != nil {
		return err
	}

	//----READ_RANGE_BY_PHONE
	dbr.RequestsList["queryReadOrderCustomerRangeByPhone"], err = DB.Prepare(
		"SELECT DISTINCT order_id, name_customer, phone, note, city, street, house, building, floor, apartment, entrance, doorphone_code FROM order_customer WHERE phone=$1 ORDER BY order_id DESC LIMIT $2  OFFSET $3")
	if err != nil {
		return err
	}

	//----READ_RANGE_BY_CITY
	dbr.RequestsList["queryReadOrderCustomerRangeByCity"], err = DB.Prepare("SELECT DISTINCT order_id, name_customer, phone, note, city, street, house, building, floor, apartment, entrance, doorphone_code FROM order_customer WHERE city=$1 ORDER BY order_id DESC LIMIT $2  OFFSET $3")
	if err != nil {
		return err
	}

	//----READ_RANGE_BY_DATE
	dbr.RequestsList["queryReadOrderCustomerRangeByDate"], err = DB.Prepare("SELECT oc.order_id, name_customer, phone, city, street, house, building, " +
		"floor, apartment, entrance, doorphone_code, note " +
		"FROM " +
		"(select order_status.time,order_status.order_id " +
		"from order_status ORDER BY time ASC LIMIT 1) os " +
		"INNER JOIN order_customer oc ON oc.order_id=os.order_id " +
		"AND os.time > $1 AND " +
		"os.time < $2 " +
		"ORDER BY oc.order_id ASC  LIMIT $3  OFFSET $4")
	if err != nil {
		return err
	}

	//----READ_RANGE_ALL
	dbr.RequestsList["queryReadOrderCustomerRangeAll"], err = DB.Prepare("SELECT order_id, name_customer, phone, note, city, street, house, building, floor, apartment, entrance, doorphone_code FROM order_customer ORDER BY order_id ASC LIMIT $1  OFFSET $2")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----DELETE_ITEM
	dbr.RequestsList["execDeleteOrderCustomer"], err = DB.Prepare("DELETE FROM order_customer WHERE order_id=$1")
	if err != nil {
		return err
	}

	//==================================================================================================================
	//==================================================================================================================
	//----ORDER_LIST----//
	dbr.RequestsList["execInsertOrderListGetID"], err = DB.Prepare("with s AS(UPDATE \"order\" SET \"Changed\"=true WHERE id=$1) " +
		"INSERT INTO order_list( " +
		"order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
		"type_name, parent_id, parent_name, image, units, value, set, " +
		"finished, discount_name, discount_percent, price, cooking_tracker, time_cook, " +
		"time_fry, composition, additionally, packaging ) " +
		"VALUES ($1, (CASE " +
		"WHEN(select max(id_item) from order_list where order_id = $1) is null THEN 1 " +
		"ELSE(select max(id_item)+1 from order_list where order_id = $1) " +
		"END), $2, $3, $4, $5, $6, " +
		"$7, $8, $9, $10, $11, $12, (case when $16 = 0 THEN true else false end), $13, " +
		"$14, $15, $16, $17, $18, $19, $20, $21) RETURNING id_item")
	if err != nil {
		return err
	}

	//dbr.RequestsList["execInsertOrderList"], err = DB.Prepare("with s AS(UPDATE \"order\" SET \"Changed\"=true WHERE id=$1) " +
	//	"INSERT INTO order_list( " +
	//	"order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
	//	"type_name, parent_id, parent_name, image, units, value, set, " +
	//	"finished, discount_name, discount_percent, price, cooking_tracker, time_cook, " +
	//	"time_fry, composition, additionally, packaging ) " +
	//	"VALUES ($1, (CASE " +
	//	"WHEN(select max(id_item) from order_list where order_id = $1) is null THEN 1 " +
	//	"ELSE(select max(id_item)+1 from order_list where order_id = $1) " +
	//	"END), $2, $3, $4, $5, $6, " +
	//	"$7, $8, $9, $10, $11, $12, (case when $16 = 0 THEN true else false end), $13, " +
	//	"$14, $15, $16, $17, $18, $19, $20, $21)")
	//if err != nil {
	//	return err
	//}

	//------------------------------------------------------------------------------------------------------------------
	//----UPDATE_FINISHED
	//dbr.RequestsList["execUpdateOrderListFinished"], err = DB.Prepare("with s AS(UPDATE order_list SET finished=$3 WHERE order_id=$1 and id_item=$2) UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")

	dbr.RequestsList["execUpdateOrderListFinished"], err = DB.Prepare("" +
		"WITH uol as(UPDATE order_list SET finished=$3 WHERE order_id=$1 and id_item=$2 RETURNING id_parent_item) " +

		", max_id as (select CASE " +
		"WHEN(select max(id) from order_status where order_id = $1) is null THEN 0 " +
		"ELSE(select max(id) from order_status where order_id = $1) " +
		"END as m)" +

		", usol as (SELECT count(*) as c FROM order_list where order_id=$1 AND id_parent_item=(SELECT id_parent_item FROM uol) AND finished=false AND id_item<>$2) " +

		", u as (UPDATE order_list SET finished=true WHERE order_id=$1 AND id_item=(SELECT id_parent_item FROM uol) AND 0 = (SELECT c FROM usol)) " +

		", i as (INSERT INTO order_status (id, order_id, order_id_item, cause, status_id,user_hash,\"time\") " +
		"SELECT m+2,$1,(SELECT id_parent_item FROM uol),'',8,'system',localtimestamp " +
		"FROM usol,max_id WHERE usol.c = 0 AND 0<>(SELECT id_parent_item FROM uol) AND (SELECT id_parent_item FROM uol) is not null), " +
		"olf as(SELECT COUNT(*) as c  FROM order_list WHERE order_id=$1 AND finished=FALSE AND id_item<>$2 AND id_item<>(select * from uol)) " +
		"INSERT INTO order_status (id, order_id, order_id_item, cause, status_id,user_hash,\"time\")  " +
		"SELECT m+1,$1,0,'',8,'system',localtimestamp FROM olf,max_id where olf.c=0;")

	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadOrderListValue"], err = DB.Prepare("" +
		"SELECT order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
		"type_name, parent_id, parent_name, image, units, value, set, " +
		"finished, discount_name, discount_percent, price, cooking_tracker, time_cook, " +
		"time_fry, composition, additionally, packaging " +
		"FROM order_list where order_id = $1 AND id_item = $2;")
	if err != nil {
		return err
	}

	//----READ_COUNT_ALL
	dbr.RequestsList["queryReadOrderListValueNumberCountAll"], err = DB.Prepare("SELECT count(*) FROM order_list")
	if err != nil {
		return err
	}

	dbr.RequestsList["queryReadOrderListValueNumberCountFinishedForOrderAndParent"], err = DB.Prepare("SELECT count(*) as c FROM order_list where order_id=$1 AND id_parent_item=$2 AND finished=$3 ")
	if err != nil {
		return err
	}

	dbr.RequestsList["queryReadOrderListValueNumberCountFinishedForOrder"], err = DB.Prepare("select count(*) from order_list where order_id=$1 AND finished=$2")
	if err != nil {
		return err
	}

	dbr.RequestsList["queryReadOrderListValueNumberGetIDParent"], err = DB.Prepare("select id_parent_item from order_list where order_id=$1 AND id_item=$2")
	if err != nil {
		return err
	}

	//----READ_COUNT_ALL
	dbr.RequestsList["queryReadOrderListValueNumberCountOrderID"], err = DB.Prepare("SELECT count(*) FROM order_list WHERE order_id=$1")
	if err != nil {
		return err
	}

	//--------------------------------------RANGE
	//----READ_RANGE_ID
	//dbr.RequestsList["queryReadOrderListRangeOrderID"], err    = DB.Prepare("" +
	//        "SELECT order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
	//        "type_name, parent_id, parent_name, image, units, value, set, " +
	//        "finished, discount_name, discount_percent, price, time_cook, " +
	//        "time_fry " +
	//        "FROM order_list where order_id = $1")
	//if err!=nil{return err}

	//----READ_RANGE_ID
	dbr.RequestsList["queryReadOrderListRangeOrderID"], err = DB.Prepare("" +
		"SELECT order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
		"type_name, parent_id, parent_name, image, units, value, set, " +
		"finished, discount_name, discount_percent, price, cooking_tracker, time_cook, " +
		"time_fry, composition, additionally, packaging " +
		"FROM order_list where  order_id = $1 ORDER BY price_name ASC;")
	//"FROM order_list where  order_id = $1 ORDER BY id_item ASC;")
	if err != nil {
		return err
	}

	//----READ_RANGE_ID
	dbr.RequestsList["queryReadOrderListRangeOrderIDSet"], err = DB.Prepare("" +
		"SELECT order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
		"type_name, parent_id, parent_name, image, units, value, set, " +
		"finished, discount_name, discount_percent, price, cooking_tracker, time_cook, " +
		"time_fry, composition, additionally, packaging " +
		"FROM order_list where  order_id = $1 AND id_parent_item = 0 ORDER BY price_name ASC;")
	//"FROM order_list where  order_id = $1 ORDER BY id_item ASC;")
	if err != nil {
		return err
	}

	//----READ_RANGE_ID
	dbr.RequestsList["queryReadOrderListRangePriceIDWithOrderID"], err = DB.Prepare("" +
		"select array " +
		"(select o.price_id from (SELECT price_name,price_id FROM order_list WHERE order_id=$1 AND set=true " +
		"union " +
		"SELECT price_name,price_id FROM order_list WHERE order_id=$1 AND set=true AND id_parent_item<>0 order by price_id asc) o), " +
		"array (select o.price_name from (SELECT price_name,price_id FROM order_list WHERE order_id=$1 AND set=true  " +
		"union " +
		"SELECT price_name,price_id FROM order_list WHERE order_id=$1 AND set=true AND id_parent_item<>0 order by price_id asc) o)")
	if err != nil {
		return err
	}

	//----READ_RANGE_ID
	dbr.RequestsList["queryReadOrderListRangeByOrgHashTimeBeginTimeEnd"], err = DB.Prepare("" +
		"SELECT order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
		"type_name, parent_id, parent_name, image, units, value, set, " +
		"finished, ol.discount_name, ol.discount_percent, ol.price, cooking_tracker, time_cook, " +
		"time_fry, composition, additionally, packaging " +
		"FROM " +
		"(select order_status.time " +
		"from order_status ORDER BY time ASC LIMIT 1) os, \"order\" o " +
		"INNER JOIN order_list ol ON ol.order_id=o.id " +
		"WHERE org_hash =$1 " +
		"AND os.time > $2 AND " +
		"os.time < $3 " +
		"ORDER BY id ASC;")
	if err != nil {
		return err
	}
	//----------------------------------------------------
	//FOR KITCHEN

	//----READ_FOR_SUSHI_MAKER
	dbr.RequestsList["queryReadOrderListRangeForCook"], err = DB.Prepare("" +
		"SELECT " +
		"order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
		"type_name, parent_id, parent_name, image, units, value, set, " +
		"finished, discount_name, discount_percent, price, cooking_tracker, " +
		"time_cook, time_fry, composition, additionally, packaging " +
		"FROM ( " +
		"SELECT ol.*, " +
		"(SELECT status_id " +
		"FROM order_status " +
		"WHERE order_id=ol.order_id AND order_id_item=0 ORDER BY \"time\" DESC LIMIT 1) as status_id_order, " +
		"(SELECT status_id " +
		"FROM order_status " +
		"WHERE order_id=ol.order_id AND order_id_item=id_item ORDER BY \"time\" DESC LIMIT 1) as status_id, " +
		"(SELECT user_hash " +
		"FROM order_status " +
		"WHERE order_id=ol.order_id AND order_id_item=id_item AND order_status.status_id=4 " +
		"ORDER BY \"time\" DESC LIMIT 1) as osu " +

		",(SELECT CASE WHEN (SELECT order_status.\"time\" " +
		"FROM order_status " +
		"WHERE order_status.order_id=ol.order_id and order_status.id = 2)is null then '9999-01-01' " +
		"ELSE (SELECT order_status.\"time\" " +
		"FROM order_status " +
		"WHERE order_status.order_id=ol.order_id and order_status.id = 2) end " +
		") as oss " +

		//",(SELECT CASE WHEN (SELECT order_status.status_id " +
		//"FROM order_status " +
		//"WHERE order_status.order_id=ol.order_id AND order_status.status_id=4 " +
		//"ORDER BY id DESC LIMIT 1)is not null then 0 else 1 end " +
		//") as oss " +
		"FROM  \"order\" o " +
		"RIGHT JOIN order_list ol ON ol.order_id=o.id " +
		"WHERE " +
		"o.org_hash=$1 " +
		"AND (select case when o.type = 'Доставка' then " +
		"o.date_preorder_cook - interval '45 minutes' else " +
		"o.date_preorder_cook - interval '30 minutes' end) < $2 " +
		"AND ol.set=false " +
		"AND ol.time_cook>0 " +
		"AND ol.finished=false " +
		")	ol " +
		"WHERE " +
		//"(cooking_tracker=$3 AND (status_id < 4 OR status_id=14 OR status_id is null) OR (status_id = 4 AND cooking_tracker=$3 AND OSU = $4)) AND status_id_order<>15 AND status_id_order<>16 " +
		"(cooking_tracker=$3 AND (status_id < 4 OR status_id=14 OR status_id is null) OR (status_id = 4 AND cooking_tracker=$3 AND OSU = $4)) AND status_id_order<>15 AND status_id_order<>16 " +
		"ORDER BY ol.oss, ol.order_id, ol.id_item  ASC  LIMIT $5  OFFSET $6",

	//	"cooking_tracker=$3 AND  (status_id < 4 OR status_id=14 OR status_id is null) OR (status_id = 4 AND cooking_tracker=$3 AND OSU = $4)  " +
	//"ORDER BY ol.order_id, ol.id_item  ASC  LIMIT $5  OFFSET $6"
	)
	if err != nil {
		return err
	}

	//----READ_FOR_PIZZA_MAKER
	//dbr.RequestsList["queryReadOrderListRangePizzaMaker"], err = DB.Prepare("" +
	//		"WITH os as ( " +
	//		"SELECT max(status_id) as status_id " +
	//		"FROM public.order_status WHERE order_id=1 AND order_id_item=11) " +
	//		"SELECT order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
	//		"type_name, parent_id, parent_name, image, units, value, set, " +
	//		"finished, ol.discount_name, ol.discount_percent, ol.price, cooking_tracker, " +
	//		"time_cook, time_fry, composition, additionally, packaging " +
	//		"FROM  os,\"order\" o " +
	//		"INNER JOIN order_list ol ON ol.order_id=o.id " +
	//		"WHERE " +
	//		"o.org_hash=$1 " +
	//		"AND (o.date_preorder_cook - interval '1 hours') < $3 " +
	//		"AND ol.set = false " +
	//		"AND ol.time_cook > 0 " +
	//		"AND ol.finished = false " +
	//		"AND order_id = $3 " +
	//		"AND id_item = $4 " +
	//		"AND os.status_id is null OR os.status_id < 4 " +
	//		"AND cooking_tracker=$5 " +
	//		"ORDER BY ol.order_id, ol.id_item  ASC LIMIT $6  OFFSET $7")
	//if err != nil {
	//	return err
	//}

	//----READ_FOR_PIZZA_MAKER_GET_WITH_STATUS_ID
	dbr.RequestsList["queryReadOrderListRangeWithStatus"], err = DB.Prepare("" +
		"SELECT " +
		"order_id, id_item, id_parent_item, price_id, price_name, type_id, " +
		"type_name, parent_id, parent_name, image, units, value, set, " +
		"finished, discount_name, discount_percent, price, cooking_tracker, " +
		"time_cook, time_fry, composition, additionally, packaging " +
		"FROM ( " +
		"SELECT ol.*, " +
		"(SELECT status_id " +
		"FROM order_status " +
		"WHERE order_id=ol.order_id AND order_id_item=0 ORDER BY \"time\" DESC LIMIT 1) as status_id_order, " +
		"(SELECT status_id " +
		"FROM order_status " +
		"WHERE order_id=ol.order_id AND order_id_item=id_item ORDER BY \"time\" DESC LIMIT 1) as status_id, " +
		"(SELECT user_hash " +
		"FROM order_status " +
		"WHERE order_id=ol.order_id AND order_id_item=id_item AND order_status.status_id=4 " +
		"ORDER BY \"time\" DESC LIMIT 1) as osu " +
		",(SELECT CASE WHEN (SELECT order_status.status_id " +
		"FROM order_status " +
		"WHERE order_status.order_id=ol.order_id AND order_status.status_id=4 " +
		"ORDER BY id DESC LIMIT 1)is not null then 0 else 1 end " +
		") as oss " +
		"FROM  \"order\" o " +
		"RIGHT JOIN order_list ol ON ol.order_id=o.id " +
		"WHERE " +
		"o.org_hash=$1 " +
		"AND (select case when o.type = 'Доставка' then " +
		"o.date_preorder_cook - interval '45 minutes' else " +
		"o.date_preorder_cook - interval '30 minutes' end) < $2 " +
		"AND ol.set=false " +
		"AND ol.time_cook>0 " +
		"AND ol.finished=false " +
		")	ol " +
		"WHERE " +
		"((cooking_tracker=$3 AND  (status_id < 4 OR status_id=14 OR status_id is null)) " +
		"OR status_id=$4 OR (status_id = 4 AND cooking_tracker=$3 AND OSU = $5)) AND status_id_order<>15 AND status_id_order<>16   " +
		//"OR (status_id=$4  AND OSU = $5) OR (status_id = 4 AND cooking_tracker=$3 AND OSU = $5)) AND status_id_order<>15 AND status_id_order<>16   " +
		"ORDER BY ol.oss, ol.order_id, ol.id_item  ASC  LIMIT $6  OFFSET $7",
	)
	if err != nil {
		return err
	}

	//--------------------------------------DELETE
	dbr.RequestsList["queryDeleteOrderListRangeOrderIDItem"], err = DB.Prepare("DELETE FROM order_list WHERE order_id=$1 AND id_item=$2")
	if err != nil {
		return err
	}

	dbr.RequestsList["queryDeleteOrderListRangeOrderID"], err = DB.Prepare("DELETE FROM order_list WHERE order_id=$1")
	if err != nil {
		return err
	}

	//==================================================================================================================
	//==================================================================================================================
	//----ORDER_PERSONAL----//
	dbr.RequestsList["execInsertOrderPersonal"], err = DB.Prepare("with s AS(INSERT INTO order_personal( " +
		"order_id, order_id_item, user_hash, first_name, second_name, " +
		"sure_name, role, role_name) " +
		"VALUES ($1, $2, $3, $4, $5, $6, $7, $8))" +
		"UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadOrderPersonalValue"], err = DB.Prepare("SELECT order_id, order_id_item, user_hash, first_name, second_name, sure_name, role, role_name FROM order_personal WHERE order_id=$1 and order_id_item=$2 and user_hash=$3")
	if err != nil {
		return err
	}

	//----READ_ITEM
	dbr.RequestsList["queryReadOrderPersonalValueNumberCountEmployment"], err = DB.Prepare("WITH iss as ( " +
		"SELECT DISTINCT order_id FROM order_status WHERE \"time\" > $2 ORDER BY order_id ASC)  " +
		", s as( " +
		"SELECT order_id, (SELECT status_id FROM order_status WHERE order_id=iss.order_id ORDER BY id DESC LIMIT 1) from iss) " +
		"SELECT COUNT(*) " +
		"FROM s " +
		"INNER JOIN order_personal op ON op.order_id = s.order_id " +
		"WHERE user_hash = $1 " +
		"AND status_id > 8 " +
		"AND status_id < 11;")
	if err != nil {
		return err
	}

	//--------------------------------------RANGE
	//----READ_RANGE_ROLE
	dbr.RequestsList["queryReadOrderPersonalRangeRole"], err = DB.Prepare("SELECT order_id, order_id_item, user_hash, first_name, second_name, sure_name, role, role_name FROM order_personal WHERE order_id=$1 and role=$2 ORDER BY first_name, second_name, sure_name ASC LIMIT $3  OFFSET $4")
	if err != nil {
		return err
	}

	//----READ_RANGE
	dbr.RequestsList["queryReadOrderPersonalRangeOrderID"], err = DB.Prepare("SELECT order_id, order_id_item, user_hash, first_name, second_name, sure_name, role, role_name FROM order_personal WHERE order_id=$1 ORDER BY first_name, second_name, sure_name ASC LIMIT $2  OFFSET $3")
	if err != nil {
		return err
	}

	//----READ_RANGE_USER_HASH
	dbr.RequestsList["queryReadOrderPersonalRangeUserHash"], err = DB.Prepare("SELECT order_id, order_id_item, user_hash, first_name, second_name, sure_name, role, role_name FROM order_personal WHERE user_hash=$1;")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----DELETE_ITEM
	dbr.RequestsList["execDeleteOrderPersonalValue"], err = DB.Prepare("DELETE FROM order_personal WHERE order_id=$1 and user_hash=$2")
	if err != nil {
		return err
	}

	//----DELETE_RANGE
	dbr.RequestsList["execDeleteOrderPersonalRange"], err = DB.Prepare("DELETE FROM order_personal WHERE order_id=$1")
	if err != nil {
		return err
	}

	//==================================================================================================================
	//==================================================================================================================
	//----ORDER_PAYMENTS----//
	//dbr.RequestsList["execInsertOrderPayments"], err = DB.Prepare("WITH s AS(INSERT INTO order_payments(order_id, user_hash, type_payments, price, \"time\") VALUES ($1, $2, $3, $4, $5)) UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")
	//if err != nil {
	//	return err
	//}
	//
	////------------------------------------------------------------------------------------------------------------------
	////----UPDATE
	//dbr.RequestsList["execUpdateOrderPayments"], err = DB.Prepare("WITH s AS(UPDATE order_payments SET price=$3, user_hash=$4,\"time\"=$5 WHERE order_id=$1 and type_payments=$2) UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")
	//if err != nil {
	//	return err
	//}
	//
	////------------------------------------------------------------------------------------------------------------------
	////----READ_ITEM
	//dbr.RequestsList["queryReadOrderPaymentsValue"], err = DB.Prepare("SELECT order_id, user_hash, type_payments, price, \"time\" FROM order_payments WHERE  order_id = $1 AND name =$2")
	//if err != nil {
	//	return err
	//}
	//
	////----READ_ITEM
	//dbr.RequestsList["queryReadOrderPaymentsValueGetSumPayOneOrder"], err = DB.Prepare("select " +
	//	"(select case when (SELECT price FROM \"order\" WHERE id = $1)is null then 0  else (SELECT price FROM \"order\" WHERE id = $1) end) - " +
	//	"(select case when (select sum(price) from order_payments where order_id = $1)is null then 0  else (select sum(price) from order_payments where order_id = $1) end) as price")
	//if err != nil {
	//	return err
	//}
	//
	////--------------------------------------RANGE
	////----READ_ALL
	//dbr.RequestsList["queryReadOrderPaymentsRangeAll"], err = DB.Prepare("SELECT order_id, user_hash, type_payments, price, \"time\" FROM order_payments ORDER BY order_id, name ASC LIMIT $1  OFFSET $2")
	//if err != nil {
	//	return err
	//}
	//
	////----READ_order_id
	//dbr.RequestsList["queryReadOrderPaymentsRangeOrderID"], err = DB.Prepare("SELECT order_id, user_hash, type_payments, price, \"time\" FROM order_payments WHERE  order_id = $1 ORDER BY order_id, name ASC LIMIT $2  OFFSET $3")
	//if err != nil {
	//	return err
	//}
	//
	////------------------------------------------------------------------------------------------------------------------
	////----DELETE_ITEM
	//dbr.RequestsList["execDeleteOrderPaymentsValue"], err = DB.Prepare("WITH s AS(DELETE FROM order_payments WHERE order_id=$1 and name=$2)UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")
	//if err != nil {
	//	return err
	//}
	//
	////----DELETE_RANGE
	//dbr.RequestsList["execDeleteOrderPaymentsRange"], err = DB.Prepare("WITH s AS(DELETE FROM order_payments WHERE order_id=$1) UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")
	//if err != nil {
	//	return err
	//}

	//==================================================================================================================
	//==================================================================================================================
	//----ORDER_STATUS
	//dbr.RequestsList["execInsertOrderStatus"], err = DB.Prepare("" +
	//	"WITH os AS( " +
	//	"SELECT CASE WHEN (select status_id from order_status where order_id=$1 AND order_id_item=0 order by \"time\" desc limit 1) IS NULL THEN 0 ELSE " +
	//	"(SELECT status_id FROM order_status WHERE order_id=$1 AND order_id_item=0 ORDER BY \"time\" DESC LIMIT 1) " +
	//	"END) " +
	//
	//	", s AS(INSERT INTO order_status( " +
	//	"order_id, order_id_item, cause, status_id, user_hash, \"time\") " +
	//	"SELECT $1, $2, $3, $4, $5, $6 FROM os WHERE os.status_id=0 OR (os.status_id<>15 AND os.status_id<>16) ) " +
	//
	//	"UPDATE \"order\" SET \"Changed\"=TRUE WHERE id=$1;")
	//if err != nil {
	//	return err
	//}
	dbr.RequestsList["execInsertOrderStatus"], err = DB.Prepare("" +
		"with max_id as (select CASE " +
		"WHEN(select max(id) from order_status where order_id = $1 limit 1) is null THEN 0 " +
		"ELSE(select max(id) from order_status where order_id = $1 limit 1) " +
		"END as m) " +
		", max_s as (select CASE " +
		"WHEN(select status_id from order_status,max_id where id = m AND order_id = $1 limit 1) is null THEN 0 " +
		"ELSE(select status_id from order_status,max_id where id = m AND order_id = $1 limit 1) " +
		"END as max_stat) " +

		"INSERT INTO order_status(id, order_id, order_id_item, cause, status_id, user_hash, \"time\") " +
		"SELECT " +
		"m+1, $1, $2, $3, $4, $5, $6  from max_id, max_s where max_stat<>15 AND max_stat<>16;")
	if err != nil {
		return err
	}

	dbr.RequestsList["execInsertOrderStatusOffline"], err = DB.Prepare("" +
		"with max_id as (select CASE " +
		"WHEN(select max(id) from order_status where order_id = $1 limit 1) is null THEN 0 " +
		"ELSE(select max(id) from order_status where order_id = $1 limit 1) " +
		"END as m) " +
		", max_s as (select CASE " +
		"WHEN(select status_id from order_status,max_id where id = m AND order_id = $1 limit 1) is null THEN 0 " +
		"ELSE(select status_id from order_status,max_id where id = m AND order_id = $1 limit 1) " +
		"END as max_stat) " +

		"INSERT INTO order_status(id, order_id, order_id_item, cause, status_id, user_hash, \"time\") " +
		"SELECT " +
		"m+1, $1, $2, $3, $4, $5, $6  from max_id, max_s where max_stat<>15 AND max_stat<>16;")
	if err != nil {
		return err
	}

	//dbr.RequestsList["execInsertOrderStatusFromSklad"], err = DB.Prepare("WITH s AS(INSERT INTO order_status (order_id, order_id_item, cause, status_id, user_hash, \"time\") VALUES ($1, $2, $3, $4, $5, $6)) UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")
	//if err != nil {
	//	return err
	//}

	//----INSERT_ORDER_STATUS
	dbr.RequestsList["execInsertOrderStatusGetError"], err = DB.Prepare("" +
		"WITH os AS( " +
		"SELECT CASE WHEN " +
		"(select status_id from order_status where order_id=$1 AND order_id_item=$2 order by \"time\" desc limit 1) " +
		"IS NULL THEN 0 ELSE " +
		"(select status_id from order_status where order_id=$1 AND order_id_item=$2 order by \"time\" desc limit 1) " +
		"END ) " +
		", us as ( " +
		"SELECT CASE WHEN " +
		"(select user_hash from order_status where order_id=$1 AND order_id_item=$2 order by \"time\" desc limit 1) " +
		"IS NULL THEN cast('' as character varying) ELSE " +
		"(select user_hash from order_status where order_id=$1 AND order_id_item=$2 order by \"time\" desc limit 1) " +
		"END ) " +
		"INSERT INTO order_status(id, order_id, order_id_item, cause, status_id, user_hash, \"time\") " +
		"SELECT (CASE " +
		"WHEN(select max(id) from order_status where order_id = $1) is null THEN 1 " +
		"ELSE(select max(id)+1 from order_status where order_id = $1) " +
		"END), $1, $2, $3, $4, $5, $6 " +
		"FROM os,us WHERE os.status_id=0 OR (os.status_id<>15 AND os.status_id<>16 AND os.status_id<>4) " +
		"OR (cast(us.user_hash as character varying)<>cast($5 as character varying) AND os.status_id=4) " +
		"returning order_id;")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadOrderStatusValue"], err = DB.Prepare("SELECT id, order_id, order_id_item, cause, status_id, user_hash, \"time\" FROM order_status WHERE  order_id=$1 AND id = $2")
	if err != nil {
		return err
	}

	//----READ_ITEM_END_STATUS
	dbr.RequestsList["queryReadOrderStatusValueStructEnd"], err = DB.Prepare("SELECT id, order_id, order_id_item, cause, status_id, user_hash, \"time\" FROM order_status WHERE order_id=$1 AND order_id_item=$2 ORDER BY id DESC LIMIT 1;")
	if err != nil {
		return err
	}

	//----READ_ITEM_END_STATUS_TimeEndActiveForUserHash
	dbr.RequestsList["queryReadOrderStatusValueTimeEndActiveForUserHash"], err = DB.Prepare("select \"time\" from order_status where user_hash=$1 AND status_id>10 order by \"time\" desc limit 1;")
	if err != nil {
		return err
	}

	//----READ_ITEM_BEGIN_TIME_USER_HASH
	dbr.RequestsList["queryReadOrderStatusValueStringUserHash"], err = DB.Prepare("SELECT user_hash FROM order_status WHERE order_id=$1 ORDER BY time ASC LIMIT 1;")
	if err != nil {
		return err
	}

	//----READ_ITEM_BEGIN_TIME_USER_HASH
	dbr.RequestsList["queryReadOrderStatusValueStructBeginOrder"], err = DB.Prepare("SELECT * FROM order_status " +
		"WHERE status_id in " +
		"(SELECT status_id FROM order_status WHERE id=1 AND order_id=$1) " +
		"AND order_id=$1 AND order_id_item = 0;")
	if err != nil {
		return err
	}

	//----READ_ITEM_END_STATUS
	dbr.RequestsList["queryReadOrderStatusValueStructIDOrdIDitIDStat"], err = DB.Prepare("SELECT id, order_id, order_id_item, cause, status_id, user_hash, \"time\" FROM public.order_status WHERE order_id=$1 AND order_id_item=$2 AND status_id=$3 ORDER BY time DESC LIMIT 1;")
	if err != nil {
		return err
	}

	//----READ_ITEM_END_STATUS
	dbr.RequestsList["queryReadOrderStatusValueStructIDOrdIDit"], err = DB.Prepare("SELECT id, order_id, order_id_item, cause, status_id, user_hash, \"time\" FROM order_status WHERE order_id=$1 AND order_id_item=$2 ORDER BY time DESC LIMIT 1;")
	if err != nil {
		return err
	}

	//----READ_ITEM_END_STATUS_ID_NUMBER
	dbr.RequestsList["queryReadOrderStatusValueNumberIDOrdIDit"], err = DB.Prepare("SELECT status_id FROM order_status WHERE order_id=$1 AND order_id_item=$2 ORDER BY time DESC LIMIT 1;")
	if err != nil {
		return err
	}

	//----READ_RANGE_order_id
	dbr.RequestsList["queryReadOrderStatusRangeOrderID"], err = DB.Prepare("SELECT id, order_id, order_id_item, cause, status_id, user_hash, \"time\" FROM order_status WHERE  order_id = $1 ORDER BY order_id, order_id_item ASC LIMIT $2  OFFSET $3")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----DELETE_ITEM
	dbr.RequestsList["execDeleteOrderStatusValue"], err = DB.Prepare("WITH s AS(DELETE FROM order_status WHERE order_id=$1 and \"time\"=$2)UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")
	if err != nil {
		return err
	}
	//----DELETE_RANGE_order_id=$1 and order_id_item=$2
	dbr.RequestsList["execDeleteOrderStatusValueOrderIDItemID"], err = DB.Prepare("WITH s AS(DELETE FROM order_status WHERE order_id=$1 and order_id_item=$2)UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")
	if err != nil {
		return err
	}
	//----DELETE_RANGE_order_id
	dbr.RequestsList["execDeleteOrderStatusValueOrderID"], err = DB.Prepare("WITH s AS(DELETE FROM order_status WHERE order_id=$1)UPDATE \"order\" SET \"Changed\"=true WHERE id=$1;")
	if err != nil {
		return err
	}

	//==================================================================================================================
	//==================================================================================================================
	//----Cashbox
	//dbr.RequestsList["execInsertCashbox"], err = DB.Prepare("INSERT INTO cashbox(order_id, \"сhange_employee_id\", first_sure_name, user_hash, role_name, org_hash, type_payments, type_operation, deposit, short_change, cause, time_operation)VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id;")

	dbr.RequestsList["execInsertCashbox"], err = DB.Prepare("" +
		"WITH sum_dep as ( " +
		"SELECT CASE WHEN ((SELECT sum(deposit) FROM cashbox WHERE order_id = $1) is not null OR $1=0)  THEN " +
		"(SELECT sum(deposit) FROM cashbox WHERE order_id = $1) ELSE 0 END ) " +

		",ins as (INSERT INTO cashbox(order_id, \"сhange_employee_id\", first_sure_name, user_hash, role_name, " +
		"org_hash, type_payments, type_operation, deposit, short_change, cause, time_operation)  " +
		"SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12 " +
		"WHERE ($9 + (SELECT * FROM sum_dep))<=(SELECT price_with_discount FROM \"order\" WHERE id = $1)  OR $1=0 RETURNING id) " +

		"SELECT CASE WHEN (SELECT * FROM ins) is null " +
		"THEN (select a from (SELECT 1 as a, raise_exception('Already paid')) aa ) " +
		"ELSE (SELECT * FROM ins) END")

	//"SELECT CASE WHEN (SELECT * FROM ins) is not null THEN (select a from (SELECT 1 as a, raise_exception('Already exists')) aa ) " +
	//"ELSE (SELECT raise_exception('Already exists')) END")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----UPDATE
	dbr.RequestsList["execUpdateCashboxCause"], err = DB.Prepare("UPDATE cashbox SET cause=$2 WHERE id = $1")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadCashboxValue"], err = DB.Prepare("SELECT id, order_id, \"сhange_employee_id\", first_sure_name, user_hash, role_name, org_hash, type_payments, type_operation,deposit, short_change, cause, time_operation FROM cashbox WHERE  id = $1")
	if err != nil {
		return err
	}

	//----READ_ITEM_Value
	dbr.RequestsList["queryReadCashboxValueNumberSumForOrder"], err = DB.Prepare("SELECT SUM(deposit) FROM cashbox WHERE order_id=$1")
	if err != nil {
		return err
	}

	//----READ_ITEM_Value
	dbr.RequestsList["queryReadCashboxValueNumberCountPriceWithDiscount"], err = DB.Prepare("SELECT count(price_with_discount) FROM " +
		"(SELECT id, price_with_discount FROM \"order\" " +
		"INNER JOIN order_personal os ON os.order_id = id " +
		"WHERE org_hash = $1 AND user_hash = $2 AND type_payments = $3 AND order_time > $4 AND  order_time < $5) as o WHERE (SELECT status_id FROM order_status WHERE order_id=o.id ORDER BY id DESC LIMIT 1)=11")
	if err != nil {
		return err
	}

	//----READ_ITEM_Value
	dbr.RequestsList["queryReadCashboxValueNumberSumPriceWithDiscount"], err = DB.Prepare("SELECT sum(price_with_discount) FROM " +
		"(SELECT id, price_with_discount FROM \"order\" " +
		"INNER JOIN order_personal os ON os.order_id = id " +
		"WHERE org_hash = $1 AND user_hash = $2 AND type_payments = $3 AND order_time > $4 AND  order_time < $5) as o WHERE (SELECT status_id FROM order_status WHERE order_id=o.id ORDER BY id DESC LIMIT 1)=11")
	if err != nil {
		return err
	}

	//----READ_ITEM_SUM
	dbr.RequestsList["queryReadCashboxValueNumberSum"], err = DB.Prepare("SELECT case when " +
		"(SELECT sum(deposit) FROM cashbox " +
		"WHERE type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) IS NULL THEN 0 " +
		"ELSE (SELECT sum(deposit) FROM cashbox " +
		"WHERE type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) END")
	if err != nil {
		return err
	}

	//----READ_ITEM_SUM_deposit<0
	dbr.RequestsList["queryReadCashboxValueNumberSumNegative"], err = DB.Prepare("SELECT case when " +
		"(SELECT sum(deposit) FROM cashbox " +
		"WHERE deposit<0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) IS NULL THEN 0 " +
		"ELSE (SELECT sum(deposit) FROM cashbox " +
		"WHERE deposit<0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) END")
	if err != nil {
		return err
	}

	//----READ_ITEM_SUM_deposit>0
	dbr.RequestsList["queryReadCashboxValueNumberSumPositive"], err = DB.Prepare("SELECT case when " +
		"(SELECT sum(deposit) FROM cashbox " +
		"WHERE deposit>0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) IS NULL THEN 0 " +
		"ELSE (SELECT sum(deposit) FROM cashbox " +
		"WHERE deposit>0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) END")
	if err != nil {
		return err
	}

	//----READ_RANGE_ALL
	dbr.RequestsList["queryReadCashboxRangeUserAndOrdAndTime"], err = DB.Prepare("SELECT id, order_id, \"сhange_employee_id\", first_sure_name, user_hash, role_name, org_hash, type_payments, type_operation,deposit, short_change, cause, time_operation FROM cashbox WHERE  user_hash=$1 AND org_hash=$2 AND time_operation > $3 AND time_operation < $4 LIMIT $5  OFFSET $6 ")
	if err != nil {
		return err
	}

	//----READ_RANGE
	dbr.RequestsList["queryReadCashboxRangeChangeEmployeeID"], err = DB.Prepare("SELECT id, order_id, \"сhange_employee_id\", first_sure_name, user_hash, role_name, org_hash, type_payments, type_operation, deposit, short_change, cause, time_operation FROM public.cashbox where \"сhange_employee_id\" = $1;")
	if err != nil {
		return err
	}

	//----READ_RANGE_BY_ORDER_ID
	dbr.RequestsList["queryReadCashboxRangeOrderID"], err = DB.Prepare("SELECT id, order_id, \"сhange_employee_id\", first_sure_name, user_hash, role_name, org_hash, type_payments, type_operation,deposit, short_change, cause, time_operation FROM cashbox WHERE  order_id=$1;")
	if err != nil {
		return err
	}

	//----READ_VALUE_SUM_DEPOSIT
	dbr.RequestsList["queryReadCashboxValueNumberDepositByUserTypePayRangeTime"], err = DB.Prepare("SELECT CASE WHEN " +
		"(SELECT SUM(deposit) FROM cashbox WHERE order_id>0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4 ) is null then 0 " +
		"ELSE (SELECT SUM(deposit) FROM cashbox WHERE order_id>0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) END")
	if err != nil {
		return err
	}

	//----READ_VALUE_BY_ORDER_ID_SUM_DEPOSIT
	dbr.RequestsList["queryReadCashboxValueNumberOrderIDSumDeposit"], err = DB.Prepare("select case when (SELECT SUM(deposit) FROM cashbox WHERE  order_id=$1) is null then 0 else (SELECT SUM(deposit) FROM cashbox WHERE  order_id=$1) end")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----DELETE_ITEM
	dbr.RequestsList["execDeleteCashbox"], err = DB.Prepare("DELETE FROM cashbox WHERE id=$1")
	if err != nil {
		return err
	}

	//==================================================================================================================
	//==================================================================================================================
	//----STATUS
	dbr.RequestsList["execInsertStatus"], err = DB.Prepare("INSERT INTO status(name) VALUES ($1) RETURNING id")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----UPDATE_STATUS
	dbr.RequestsList["execUpdateStatus"], err = DB.Prepare("UPDATE status SET name=$2 WHERE id=$1")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadStatusValue"], err = DB.Prepare("SELECT id, name FROM status WHERE  id = $1")
	if err != nil {
		return err
	}

	//----READ_RANGE_ALL
	dbr.RequestsList["queryReadStatusRangeAll"], err = DB.Prepare("SELECT id, name FROM status")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----DELETE_ITEM
	dbr.RequestsList["execDeleteStatus"], err = DB.Prepare("DELETE FROM status WHERE id=$1")
	if err != nil {
		return err
	}

	//==================================================================================================================
	//==================================================================================================================
	//----TYPE_PAYMENTS
	dbr.RequestsList["execInsertTypePayment"], err = DB.Prepare("INSERT INTO type_payment(name) VALUES ($1) RETURNING id")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----UPDATE_STATUS
	dbr.RequestsList["execUpdateTypePayment"], err = DB.Prepare("UPDATE type_payment SET name=$2 WHERE id=$1")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadTypePaymentValue"], err = DB.Prepare("SELECT id, name FROM type_payment WHERE  id = $1")
	if err != nil {
		return err
	}

	//----READ_RANGE_ALL
	dbr.RequestsList["queryReadTypePaymentRangeAll"], err = DB.Prepare("SELECT id, name FROM type_payment")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----DELETE_ITEM
	dbr.RequestsList["execDeleteTypePayment"], err = DB.Prepare("DELETE FROM type_payment WHERE id=$1")
	if err != nil {
		return err
	}

	//==================================================================================================================
	//==================================================================================================================
	//----timers_cook
	dbr.RequestsList["execInsertTimersCook"], err = DB.Prepare("WITH max_count AS (SELECT CASE " +
		"WHEN(SELECT max(count) FROM timers_cook WHERE order_id = $1 AND order_id_item = $2 LIMIT 1) IS NULL THEN 0 " +
		"ELSE(SELECT max(count) FROM timers_cook WHERE order_id = $1 AND order_id_item = $2 LIMIT 1) END AS m) " +
		"INSERT INTO timers_cook( " +
		"order_id, order_id_item, time_begin, time_end, count, finished) " +
		"SELECT $1, $2, $3, $4, m+1, $5 FROM max_count;")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----UPDATE_STATUS
	dbr.RequestsList["execUpdateTimersCook"], err = DB.Prepare("UPDATE timers_cook " +
		"SET time_end = $3, finished=true " +
		"WHERE order_id=$1 AND order_id_item=$2 AND count = (select CASE " +
		"WHEN(SELECT max(count) FROM timers_cook WHERE order_id = $1 AND order_id_item = $2 LIMIT 1) IS NULL THEN 0 " +
		"ELSE(SELECT max(count) FROM timers_cook WHERE order_id = $1 AND order_id_item = $2 LIMIT 1)END AS m);")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadTimersCookValue"], err = DB.Prepare("SELECT order_id, order_id_item, time_begin, time_end, count, finished from timers_cook " +
		"WHERE order_id=$1 AND order_id_item=$2 AND count = (select CASE " +
		"WHEN(SELECT max(count) FROM timers_cook WHERE order_id = $1 AND order_id_item = $2 LIMIT 1) IS NULL THEN 0 " +
		"ELSE(SELECT max(count) FROM timers_cook WHERE order_id = $1 AND order_id_item = $2 LIMIT 1)END AS m);")
	if err != nil {
		return err
	}

	//==================================================================================================================
	//==================================================================================================================
	//----ChangeEmployee
	dbr.RequestsList["execInsertChangeEmployeeGetID"], err = DB.Prepare("INSERT INTO \"сhange_employee\"( " +
		"user_hash, org_hash, sum_in_cashbox, \"non_cash_end_day\", cash_end_day, close, date_begin, date_end) " +
		"VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;")
	if err != nil {
		return err
	}

	//------------------------------------------------------------------------------------------------------------------
	//----UPDATE_CLOSE_courrier
	dbr.RequestsList["execUpdateChangeEmployeeClose"], err = DB.Prepare("" +
		"with a as (select close from \"сhange_employee\" where id = $1 ), s as( " +
		"UPDATE \"сhange_employee\" SET sum_in_cashbox=$2, non_cash_end_day=$3, cash_end_day=$4, close=true, date_end=$5 WHERE id = $1 AND false in (select close from a)) " +
		"SELECT raise_exception('Already closed') FROM a WHERE a.close = true;")
	//"UPDATE \"сhange_employee\" SET sum_in_cashbox=$2, non_cash_end_day=$3, cash_end_day=$4, close=true, date_end=$5 WHERE id = $1;")
	if err != nil {
		return err
	}

	//dbr.RequestsList["execUpdateChangeEmployeeCloseCourrier"], err = DB.Prepare("WITH hash AS( " +
	//"SELECT sum(price_with_discount) FROM " +
	//"(SELECT id, price_with_discount FROM \"order\" " +
	//"INNER JOIN order_personal os ON os.order_id = id WHERE " +
	//"org_hash = (SELECT org_hash FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND user_hash = (SELECT user_hash FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND type_payments = 1 " +
	//"AND order_time > (SELECT date_begin FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND  order_time < $2 " +
	//") as o " +
	//"WHERE (SELECT status_id FROM order_status WHERE order_id=o.id ORDER BY id DESC LIMIT 1)=11) " +
	//
	//", nonhash AS( " +
	//"SELECT sum(price_with_discount) as s " +
	//"FROM (SELECT id, price_with_discount FROM \"order\" " +
	//"INNER JOIN order_personal os ON os.order_id = id " +
	//"WHERE org_hash = (SELECT org_hash FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND user_hash = (SELECT user_hash FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND type_payments = 2 " +
	//"AND order_time > (SELECT date_begin FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND  order_time < $2 " +
	//") as o " +
	//"WHERE (SELECT status_id FROM order_status WHERE order_id=o.id ORDER BY id DESC LIMIT 1)=11) " +
	//
	//"UPDATE \"сhange_employee\" " +
	//"SET non_cash_end_day=(SELECT s FROM nonhash), " +
	//"cash_end_day=(SELECT s FROM hash), close=true, date_end=$2 " +
	//"WHERE id = $1;")
	//if err != nil {
	//	return err
	//}
	//
	////----UPDATE_CLOSE_Cashier
	//dbr.RequestsList["execUpdateChangeEmployeeCloseCashier"], err = DB.Prepare("WITH hash AS( " +
	//"SELECT sum(price_with_discount) FROM " +
	//"(SELECT id, price_with_discount FROM \"order\" " +
	//"INNER JOIN order_personal os ON os.order_id = id WHERE " +
	//"org_hash = (SELECT org_hash FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND user_hash = (SELECT user_hash FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND type_payments = 1 " +
	//"AND order_time > (SELECT date_begin FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND  order_time < $2 " +
	//") as o " +
	//"WHERE (SELECT status_id FROM order_status WHERE order_id=o.id ORDER BY id DESC LIMIT 1)=11) " +
	//
	//", nonhash AS( " +
	//"SELECT sum(price_with_discount) as s " +
	//"FROM (SELECT id, price_with_discount FROM \"order\" " +
	//"INNER JOIN order_personal os ON os.order_id = id " +
	//"WHERE org_hash = (SELECT org_hash FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND user_hash = (SELECT user_hash FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND type_payments = 2 " +
	//"AND order_time > (SELECT date_begin FROM \"сhange_employee\" WHERE id = $1) " +
	//"AND  order_time < $2 " +
	//") as o " +
	//"WHERE (SELECT status_id FROM order_status WHERE order_id=o.id ORDER BY id DESC LIMIT 1)=11) " +
	//
	//"UPDATE \"сhange_employee\" " +
	//"SET non_cash_end_day=(SELECT s FROM nonhash), " +
	//"cash_end_day=(SELECT s FROM hash), close=true, date_end=$2 " +
	//"WHERE id = $1;")
	//if err != nil {
	//	return err
	//}

	//------------------------------------------------------------------------------------------------------------------
	//----READ_ITEM
	dbr.RequestsList["queryReadChangeEmployeeValue"], err = DB.Prepare("SELECT id, user_hash, org_hash, sum_in_cashbox, non_cash_end_day, cash_end_day, close, date_begin, date_end FROM \"сhange_employee\" WHERE id = $1;")
	if err != nil {
		return err
	}

	//----READ_RANGE_ALL
	dbr.RequestsList["queryReadChangeEmployeeRangeCloseUserHashOrgHash"], err = DB.Prepare("SELECT id, user_hash, org_hash, sum_in_cashbox, non_cash_end_day, cash_end_day, close, date_begin, date_end FROM \"сhange_employee\" WHERE user_hash = $1 AND org_hash = $2 AND close = $3 ORDER BY date_begin DESC  LIMIT $4  OFFSET $5;")
	if err != nil {
		return err
	}

	//----READ_RANGE_ALL
	dbr.RequestsList["queryReadChangeEmployeeRangeCloseOrgHash"], err = DB.Prepare("SELECT id, user_hash, org_hash, sum_in_cashbox, non_cash_end_day, cash_end_day, close, date_begin, date_end FROM \"сhange_employee\" WHERE org_hash = $1 AND close = $2 ORDER BY date_begin DESC  LIMIT $3  OFFSET $4;")
	if err != nil {
		return err
	}

	return nil
}

func (dbr *DBRequests) CloseRequests() error {

	dbr.rlock.Lock()
	defer dbr.rlock.Unlock()
	for _, request := range dbr.RequestsList {
		if err := request.Close(); err != nil {
			return err
		}

	}
	return nil
}

func (dbr *DBRequests) ExecTransact(requestName string, values ...interface{}) error {

	dbr.rlock.RLock()
	defer dbr.rlock.RUnlock()
	_, ok := dbr.RequestsList[requestName]
	if !ok {
		return errors.New("Mismatch request!")
	}

	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Stmt(dbr.RequestsList[requestName]).Exec(values...)
	if err != nil {
		return err
	}

	err = tx.Commit()
	return err
}

func (dbr *DBRequests) QueryRow(requestName string, values ...interface{}) (*sql.Row, error) {

	dbr.rlock.RLock()
	defer dbr.rlock.RUnlock()

	_, ok := dbr.RequestsList[requestName]
	if !ok {
		return nil, errors.New("Missmatch request!")
	}

	row := dbr.RequestsList[requestName].QueryRow(values...)

	return row, nil
}

func (dbr *DBRequests) Query(requestName string, values ...interface{}) (*sql.Rows, error) {

	dbr.rlock.RLock()
	defer dbr.rlock.RUnlock()

	_, ok := dbr.RequestsList[requestName]
	if !ok {
		return nil, errors.New("Missmatch request!")
	}

	rows, err := dbr.RequestsList[requestName].Query(values...)
	if err != nil {
		return nil, err
	}

	return rows, nil
}

func init() {

	var err error

	DB, err = sql.Open("postgres", "postgres://"+conf.Config.Postgre_write_user+":"+conf.Config.Postgre_write_password+"@"+conf.Config.Postgre_host+"/"+conf.Config.Postgre_database+"?sslmode="+conf.Config.Postgre_ssl)
	if err != nil {
		log.Panic("Postgresql writer not found!:", err)
		return
	}

	if err = DB.Ping(); err != nil {
		log.Panic("Postgresql not reply!:", err)
		return
	}

	if err = Requests.InitDatabaseRequests(); err != nil {
		log.Panic("Postgresql request init error:", err.Error())
		return
	}

	log.Println("Postgresql running!")
    Guard.Init()
}
