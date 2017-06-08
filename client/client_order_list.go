package main

import (
	"project/orders/structures"
	"encoding/json"
	"strconv"
)

func orderList(id int) error {
	orlist := structures.OrderList{
		Order_id:ID,
		ID_item:1,
		ID_parent_item:0,
		Price_id:69,
		PriceName:"PriceName",
		Type_id:32,
		TypeName:"TypeName",
		Parent_id:2,
		ParentName:"ParentName",
		Image:"img address",
		Units:"asd",
		Value:1.2,
		Set:true,
		Finished:false,
		DiscountName:"Адики",
		DiscountPercent:10,
		Price:10,
		TimeCook:666,
		TimeFry:13,
		Composition:"Composition",
		Additionally:"Additionally",
		Packaging:"Packaging",
	}
	qm := structures.QueryMessage{Table:"OrderList"}
	switch id {
	case 1:
		println("----CREATE")
		qm.Query = "Create"
		qm.TypeParameter="GetID"
		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		orlist.Order_id=int64(IDitem)
		orlist.Price_id=int64(ID)
		orM, err := json.Marshal(orlist)
		if err != nil {
			println(err.Error())
			return err
		}
		buf, err := send(string(qmM) + string(orM))
		if err != nil {
			return err
		}
		println(string(buf))
		ids, err := strconv.Atoi(string(buf[3:]))
		IDitem = int64(ids)
		if err != nil {
			println("DONT_CONVERT_MESSAGE_TO_INT64")
			return err
		}
		//------------------------------------------------
		orlist.Price_id = ID
		orM, err = json.Marshal(orlist)
		if err != nil {
			println(err.Error())
			return err
		}
		buf, err = send(string(qmM) + string(orM))
		if err != nil {
			return err
		}
		println(string(buf))
		ids, err = strconv.Atoi(string(buf[3:]))
		IDitem = int64(ids)
		if err != nil {
			println("DONT_CONVERT_MESSAGE_TO_INT64")
			return err
		}
	case 2:
		println("----UPDATE")
		qm.Query = "Update"
		qm.TypeParameter = "Finished"
		qm.Values = []interface{}{ID,IDitem,true}
		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		_, err = send(string(qmM))
		if err != nil {
			return err
		}
	case 30:
		println("----READ_VALUE")
		qm.Query = "Read"
		qm.TypeParameter = "Value"
		qm.Values = []interface{}{ID,IDitem}
		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		_, err = send(string(qmM))
		if err != nil {
			return err
		}
	case 40:
		println("----READ_RANGE")
		qm.Query = "Read"
		qm.TypeParameter = "RangeOrderID"
		qm.Values = []interface{}{true,10,0}
		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		sendReadRange(string(qmM))
	}

	return nil
}
