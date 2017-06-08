package main

import (
	"encoding/json"
	"project/orders/structures"
	"strconv"
	"time"
	"errors"
)





func order(id int) error {

	TimeDelivery, _ := time.Parse("2006-01-02T15:04:05.000000", "2016-11-10T14:58:04.095037")
	DatePreOrderCook, _ := time.Parse("2006-01-02T15:04:05.000000", "2016-11-10T14:58:04.095037")
	//TimeDeliveredBy,_:=time.Parse("2006-01-02T15:04:05.000000", "2016-11-10T14:58:04.095037")
	or := structures.Order{ID: ID,
		SideOrder:         2,
		TimeDelivery:      TimeDelivery,
		DatePreOrderCook:  DatePreOrderCook,
		CountPerson:       1,
		Division:          "sdlkjjfh283768",
		OrgHash:           "kjsadfui82378723sdhj",
		Note:              "Курочка ряба снясла яичко под чистую",
		DiscountName:      "За три полоски на штанах",
		DiscountPercent:   10,
		Bonus:             12,
		Type:              "12",
		Price:             323654,
		PriceWithDiscount: 6546,
		PriceCurrency:     "деревянные",
	}
	qm := structures.QueryMessage{Table:"Order"}

	switch id {
	case 0:
		//----PING------------------------------------------------------------------------------------------------------
		println("-------------- PING --------------")
		message := "PING"
		_, err := send(string(message))
		if err != nil {
			return err
		}
	case 1:
		//----CREATE----------------------------------------------------------------------------------------------------
		println("------------- CREATE -------------")
		println(ID)
		qm.Query = "Create"
		qm.TypeParameter = "GetID"

		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}

		orM, err := json.Marshal(or)
		if err != nil {
			println(err.Error())
			return err
		}

		buf, err := send(string(qmM) + string(orM))
		if err != nil {
			return err
		}
		ids, err := strconv.Atoi(string(buf[3:]))
		ID = int64(ids)
		if err != nil {
			println("DONT_CONVERT_MESSAGE_TO_INT64")
			return err
		}
	case 2:
		println("------------- CREATE -------------")
		println(ID)
		println("ЗАПРЕЩЕНО!!!")
		/*qm.Table = "Order"
		  qm.Query = "Create"
		  qm.TypeParameter = ""
		  qmM,err := json.Marshal(qm)
		  if err!=nil {println(err.Error());return}

		  orM,err := json.Marshal(or)
		  if err!=nil {println(err.Error());return}

		  buf := send(string(qmM)+string(orM), conn)
		  println(len(string(buf)))
		  println(string(buf))

		  if len(buf)>2&&string(buf)[:2]=="00" {
		      return errors.New(string(buf))
		      color.Red(string(buf))
		  }else{
		      //color.Green("",len(string(buf)))
		      color.Green(string(buf))
		  }*/
	case 3: //----------update
		println("----UPDATE_TIME_PRE_ORDER_COOK")
		qm.Query = "Update"
		qm.TypeParameter = "DatePreOrderCook"
		qm.Values = []interface{}{or.ID, or.TimeDelivery.Add(10), or.DatePreOrderCook}
		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		_, err = send(string(qmM))
		if err != nil {
			return err
		}

	case 4:
		println("----UPDATE_REDONE")
		//qm.Table = "Order"
		//qm.Query = "Update"
		//qm.TypeParameter = "Redone"
		//qm.Values = []interface{}{or.ID, false, "Потому что гладиолус"}
		//qmM, err := json.Marshal(qm)
		//if err != nil {
		//	println(err.Error())
		//	return err
		//}
		//_, err = send(string(qmM))
		//if err != nil {
		//	return err
		//}

	case 5:
		println("----UPDATE_PRICE")
		qm.Query = "Update"
		qm.TypeParameter = "Price"
		qm.Values = []interface{}{or.ID, 324764, 123, "rub"}

		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		_, err = send(string(qmM))
		if err != nil {
			return err
		}
	case 6:
		println("----UPDATE_DISCOUNT")
		qm.Query = "Update"
		qm.TypeParameter = "Discount"
		qm.Values = []interface{}{or.ID, 30}

		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		_, err = send(string(qmM))
		if err != nil {
			return err
		}

	case 7:
		//println("----UPDATE_STATUS")
		//qm.Query = "Update"
		//qm.TypeParameter = "Status"
		//qm.Values = []interface{}{or.ID,"Передан"}
		//qmM,err := json.Marshal(qm)
		//if err!=nil {println(err.Error());return err}
		//_,err = send(string(qmM))
		//if err!=nil{return err}
	//-------------------------------------------------------------------

	case 50: //----------READ
		println("----READ_VALUE")
		qm.Query = "Read"
		qm.TypeParameter = "Value"
		qm.Values = []interface{}{or.ID}
		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		_, err = send(string(qmM))
		if err != nil {
			return err
		}
	case 51:
		println("----READ_VALUE_STATUS")
		println("НЕНУЖЕН ТУТ ОН")
		//qm.Table = "Order"
		//qm.Query = "Read"
		//qm.TypeParameter = "ValueStringStatus"
		//qm.Values = []interface{}{or.ID}
		//qmM, err := json.Marshal(qm)
		//if err != nil {
		//	println(err.Error())
		//	return err
		//}
		//_, err = send(string(qmM))
		//if err != nil {
		//	return err
		//}
	case 52:
		println("----READ_VALUE_CAOUNT_ALL")
		qm.Query = "Read"
		qm.TypeParameter = "ValueNumberCountAll"
		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		_, err = send(string(qmM))
		if err != nil {
			return err
		}
	case 60:
		qm.Query = "Read"
		qm.TypeParameter = "RangeType"
		qm.Values = []interface{}{or.Type}
		qm.Limit = 10
		qm.Offset = 0
		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		sendReadRange(string(qmM))
	//-------------------------------------------------------------------
	case 100: //----------DELETE
		println("----DELETE_ITEM?")
		qm.Query = "Delete"
		qm.TypeParameter = "Item"
		qm.Values = []interface{}{or.ID}
		qmM, err := json.Marshal(qm)
		if err != nil {
			println(err.Error())
			return err
		}
		_, err = send(string(qmM))
		if err != nil {
			return err
		}

	default:
		println("Unidentified ID?")
		return errors.New("Unidentified ID")
	}
	return nil
}
