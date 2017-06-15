package structures

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"project/order/conf"
	"strconv"
	"strings"
	"time"
    "project/order/postgres"
)

//----------------------------------------------------------------------------------------------------------------------
/*----READ_FOR_TABLE----*/
//----ORDER
func (str *Structures) QueryRead() error {
    var err error
    str.st, err = str.Reads.Read(str.QM)
    return err
}
func (str *Structures) Read() error {
    var err error
    //println("str.QM.TypeParameter:",fmt.Sprint(str.QM.TypeParameter))

    str.Buf = nil

    if str.QM.TypeParameter == "Value" {
        err = str.Orders.ReadRow(str.st.Row)
        if err == nil {
            str.Buf, err = json.Marshal(str.Orders)

        }
    } else {
        if len(str.QM.TypeParameter) < 6 {
            return errors.New("The length of the parameter type does not satisfy the requirements of")
        }
        switch str.QM.TypeParameter[5:11] {
        case "String":
            err = str.ReadeByteArray()
        case "Boolea":
            err = str.ReadeByteArray()
        case "Number":
            err = str.ReadeByteArray()
        case "Struct":
            err = str.Orders.ReadRow(str.st.Row)
            if err == nil {
                str.Buf, err = json.Marshal(str.Orders)
            }
        default:
            return errors.New("NOT IDENTIFICATION TYPE PARAMETERS")
        }
    }

    return err
}


func (str *Structures) ReadRows() (bool,error) {
    if  str.st.Rows == nil {
        str.st.Rows.Close()
        return false,errors.New("READ ROWS: Nil pointer")
    }


    b:=str.st.Rows.Next()
    if b==false{
        str.st.Rows.Close()
        return false,nil
    }

    err := str.Orders.ReadRows(str.st.Rows)
    if err == nil {
        str.Buf, err = json.Marshal(str.Orders)
    }


    if err != nil{
        return false,err
    }


    return b, err
}


func (str *Structures) ReadeByteArray() (error) {
    err := str.st.Row.Scan(&str.Buf)
    if err != nil {
        return err
    }
    return nil
}




func messageToWebSoc(table string, values ...interface{}) {
	var err error

	stream := postgres.Stream{}
	err = stream.ReadRow("Order", "ValueStringOrgHash", values[0])
	if err == nil {
		//cl := ClientList
		qms := QueryMessage{}
		qms.Table = table
		//qms.Query = qm.Query
		//qms.TypeParameter = qm.TypeParameter
		qms.Values = values
		err = stream.Row.Scan(&qms.ID_msg)
		if err == nil {
			msg, err := json.Marshal(qms)
			//sarr := strings.Split(string(msg),"[")
			//sarr2 := strings.Split(sarr[1],"]")
			//st := strings.Replace(sarr[0],"\"","",-1)
			//var hash_org string
			//stream.Row.Scan(&hash_org)
			if err == nil {
				msg = append([]byte("02:{"), msg...)
				/*for _, conn := range cl {
					println("messageToWebSoc: ", string(msg))
					//conn.Send <- msg
				}*/
			}
		}
	}

	if err != nil {
		log.Println(err.Error())
	}
}

func messageToWebSocWithHashOrg(table, orghash string, values ...interface{}) {
	qms := QueryMessage{}
	qms.ID_msg = orghash
	qms.Table = table
	//qms.Query = qm.Query
	//qms.TypeParameter = qm.TypeParameter
	qms.Values = values
	msg, err := json.Marshal(qms)
	if err == nil {
		msg = append([]byte("02:{"), msg...)
		/*for _, ss := range ClientList {
			ss.Send <- msg
		}*/
	}
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----FUNCTION_FOR_ALL
func (*All) Update(qm *QueryMessage) error {
	mng := postgres.Requests
	println("UPDATE", qm.Table, fmt.Sprint(qm.TypeParameter))
	err := mng.Update(qm.Table, qm.TypeParameter, qm.Values...)

	if err == nil {
		if qm.Table == "OrderList" && qm.TypeParameter == "Finished" {
			if len(qm.Values) < 2 {
				return err
			}
			s := postgres.Stream{}
			err2 := s.ReadRow("OrderList", "ValueNumberGetIDParent", qm.Values[0], qm.Values[1])
			if err2 == nil {
				var parent int
				err2 = s.Row.Scan(&parent)
				if err2 == nil {
					err2 = s.ReadRow("OrderList", "ValueNumberCountFinishedForOrderAndParent", qm.Values[0], parent, false)
					if err2 == nil {
						err2 = s.Row.Scan(&parent)
						if err2 == nil && parent == 0 {
							//Создание записи в базе данных
							err2 = postgres.Requests.ExecTransact("OrderStatus", qm.Values[0], 0, "", 8, "system", time.Now())
							if err2 == nil {
								messageToWebSoc("OrderStatus", qm.Values[0], 0, 8, time.Now())
							}
						}
					}
				}
			}
			if err2 != nil {
				log.Println("UPDATE -", err2)
			}
		}
	}

	return err
}

//----Чтение
func (*Read) Read(qm *QueryMessage) (*postgres.Stream, error) {

	stream := postgres.Stream{}
	var err error

	if len(qm.TypeParameter) < 5 {
		return &stream, errors.New("length word does not satisfy the requirements of")
	}

	switch qm.TypeParameter[:5] {
	case "Value":
		err = stream.ReadRow(qm.Table, qm.TypeParameter, qm.Values...)
		if err != nil {
			return &stream, err
		}
	case "Range":
		if qm.Limit > 0 {
			qm.Values = append(qm.Values, qm.Limit, qm.Offset)
			err = stream.ReadRows(qm.Table, qm.TypeParameter, qm.Values...)
			if err != nil {
				return &stream, err
			}
		} else {
			err = stream.ReadRows(qm.Table, qm.TypeParameter, qm.Values...)
			if err != nil {
				return &stream, err
			}
		}
	default:
		return &stream, errors.New("NOT IDENTIFICATION TYPE PARAMETERS")
	}

	return &stream, nil
}

func (*All) Delete(qm *QueryMessage) error {
	err :=postgres.Requests.Delete(qm.Table, qm.TypeParameter, qm.Values...)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER
func (or *Order) SetOrderID(id int64){}
func (or *Order) GetOrderID()int64{return 0}

func (or *Order) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){

	//row, err := postgres.Requests.InsertGetID(tx, table, type_parameter,
	id, err := postgres.Requests.InsertGetID(tx, table, type_parameter,
		or.SideOrder, or.TimeDelivery, or.DatePreOrderCook, or.CountPerson,
		or.Division, or.NameStorage, or.OrgHash, or.Note, or.DiscountName, or.DiscountPercent,
		or.Bonus, or.Type, or.Price, or.PriceWithDiscount, or.PriceCurrency, or.TypePayments, time.Now(), false)
	if err != nil || id == nil {
		return nil, err
	}

	//err = row.Scan(&or.ID)
	//if err != nil {
	//	messageToWebSoc(table, or.ID)
	//	return nil, err
	//}

	messageToWebSoc(table, id)

	return id, err
}

func (or *Order) PostTransaction()error {
	return nil
}
func (or *Order) ReadRow(row *sql.Row) error {
	err := row.Scan(&or.ID, &or.SideOrder, &or.TimeDelivery, &or.DatePreOrderCook, &or.CountPerson,
		&or.Division, &or.NameStorage, &or.OrgHash, &or.Note, &or.DiscountName, &or.DiscountPercent,
		&or.Bonus, &or.Type, &or.Price, &or.PriceWithDiscount, &or.PriceCurrency, &or.TypePayments, &or.Order_time, &or.Paid_off,
	)
	return err
}

func (or *Order) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&or.ID, &or.SideOrder, &or.TimeDelivery, &or.DatePreOrderCook, &or.CountPerson,
		&or.Division, &or.NameStorage, &or.OrgHash, &or.Note, &or.DiscountName, &or.DiscountPercent,
		&or.Bonus, &or.Type, &or.Price, &or.PriceWithDiscount, &or.PriceCurrency, &or.TypePayments, &or.Order_time, &or.Paid_off,
	)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_CUSTOMER
func (oc *OrderCustomer) SetOrderID(id int64){oc.Order_id = id}
func (oc *OrderCustomer) GetOrderID()int64{return oc.Order_id}



func (oc *OrderCustomer) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){


	err := postgres.Requests.Insert(
		tx, table, type_parameter,
		oc.Order_id, oc.NameCustomer, oc.Phone, oc.Note,
		oc.City, oc.Street, oc.House, oc.Building,
		oc.Floor, oc.Apartment, oc.Entrance,
		oc.DoorphoneCode,
	)

	messageToWebSoc(table, oc.Order_id)

	return -1, err
}

func (oc *OrderCustomer) PostTransaction()error {
    return nil
}

func (oc *OrderCustomer) ReadRow(row *sql.Row) error {
	err := row.Scan(
		&oc.Order_id, &oc.NameCustomer, &oc.Phone, &oc.Note,
		&oc.City, &oc.Street, &oc.House, &oc.Building,
		&oc.Floor, &oc.Apartment, &oc.Entrance,
		&oc.DoorphoneCode,
	)
	return err
}

func (oc *OrderCustomer) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(
		&oc.Order_id, &oc.NameCustomer, &oc.Phone, &oc.Note,
		&oc.City, &oc.Street, &oc.House, &oc.Building,
		&oc.Floor, &oc.Apartment, &oc.Entrance,
		&oc.DoorphoneCode,
	)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_LIST
func (orl *OrderList) SetOrderID(id int64){orl.Order_id = id}
func (orl *OrderList) GetOrderID()int64{return orl.Order_id}

func (orl *OrderList) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){

	//row, err := postgres.Requests.InsertGetID(
    id, err := postgres.Requests.InsertGetID(
		tx, table, type_parameter,
		orl.Order_id, orl.ID_parent_item,
		orl.Price_id, orl.PriceName, orl.Type_id, orl.TypeName, orl.Parent_id, orl.ParentName,
		orl.Image, orl.Units, orl.Value, orl.Set, orl.DiscountName, orl.DiscountPercent,
		orl.Price, orl.CookingTracker, orl.TimeCook, orl.TimeFry,
		orl.Composition, orl.Additionally, orl.Packaging,
	)

	//----ОБРАЩАЕМСЯ К МИКРОСЕРВИСУ ПРОДУКТОВ ДЛЯ ПОЛУЧЕНИЯ ЭЛЕМЕНТОВ ПРОДУКТА
	if err == nil && id != nil{
		//err = row.Scan(&orl.ID_item)
		if err == nil {
            //messageToWebSoc(table, orl.Order_id, orl.ID_item)
            var err2 error
            orl.ID_item, err2 = strconv.ParseInt(fmt.Sprint(id), 10, 64)
            if err2 == nil {

                messageToWebSoc(table, orl.Order_id, orl.ID_item)
                cop := ClientOrder{
                    IP:  conf.Config.TLS_serv_product,
                    MSG: []byte("{\"Table\":\"ProductOrder\",\"Query\":\"Read\",\"TypeParameter\":\"Price_id\",\"Values\":[" + fmt.Sprintf("%v", orl.Price_id) + "]}"),
                }
                cop.Write()
	            err2 = cop.Err
                if err2 == nil {
                    //var n int
                    //buf := make([]byte, 9999)
                    //var row2 *sql.Row
                    var id interface{}
                    var ol OrderList
                    for {
                        //n, err2 = cop.Conn.Read(buf)
                        //if err==nil {
                        //	n, err2 = strconv.Atoi(string(buf))
                        //	if err == nil {
                        //		buf = make([]byte, n)
                        //		n, err2 = io.ReadFull(cop.Conn, buf)
                        //	}
                        //}

                        cop.Read()
	                    err2 = cop.Err
                        if err2 == nil {
                            if strings.ToUpper(strings.TrimSpace(string(cop.ReadB))) == "01:EOF" {
                                break
                            }
                            //buf = make([]byte, 4)

                            err2 = json.Unmarshal(cop.ReadB, &ol)
                            if err2 == nil {
                                ol.Order_id = orl.Order_id
                                ol.ID_parent_item = orl.ID_item
                                fmt.Sprintf("%v", ol)
                                //row2, err2 = postgres.Requests.InsertGetID(
                                id, err2 = postgres.Requests.InsertGetID(
                                    tx, table, type_parameter,
                                    ol.Order_id, ol.ID_parent_item,
                                    ol.Price_id, ol.PriceName, ol.Type_id, ol.TypeName,
                                    ol.Parent_id, ol.ParentName,
                                    ol.Image, ol.Units, ol.Value, ol.Set, ol.DiscountName, 100, //ol.DiscountPercent,
                                    //            CookingTracker
                                    ol.Price, ol.CookingTracker, ol.TimeCook, ol.TimeFry, ol.Composition, ol.Additionally, ol.Packaging,
                                )
                                if err2 == nil && id !=nil {
                                    //err2 = row2.Scan(&ol.ID_item)
                                    //if err2 == nil {
                                    //println("------messageToWebSoc",orl.Order_id, ol.ID_item,"\n")
                                    //messageToWebSoc(table, orl.Order_id, ol.ID_item)
                                    messageToWebSoc(table, orl.Order_id, id)

                                    //}
                                }
                            }
                        }
                        if err2 != nil {
                            println("ERROR=================================")
                            println(err2.Error())
                        }

                    }
                }
            }
			if err2 != nil {
				//log.Println(err2.Error())
				log.Println(err2.Error())
				err2 = nil
			}
		}
	}
	if err != nil {
		//return int64(-1), err
		return nil, err
	}

	//return orl.ID_item, err
	return id, err
}

func (orl *OrderList) PostTransaction()error {
    return nil
}

func (orl *OrderList) ReadRow(row *sql.Row) error {
	err := row.Scan(
		&orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
		&orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
		&orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
		&orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
		&orl.Composition, &orl.Additionally, &orl.Packaging,
	)
	return err
}

func (orl *OrderList) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(
		&orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
		&orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
		&orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
		&orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
		&orl.Composition, &orl.Additionally, &orl.Packaging,
	)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_PERSONAL
//func (op *OrderPersonal) Insert(qm *QueryMessage, tx *sql.Tx) (int64, error){
func (op *OrderPersonal)  SetOrderID(id int64){op.Order_id = id}
func (op *OrderPersonal)  GetOrderID()int64{return op.Order_id}

func (op *OrderPersonal) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){
	err := postgres.Requests.Insert(
		tx, table, type_parameter,
		op.Order_id, op.Order_id_item, op.UserHash,
		op.FirstName, op.SecondName, op.SurName,
		op.RoleHash, op.RoleName,
	)

	messageToWebSoc(table, op.Order_id, op.Order_id_item, op.UserHash, op.RoleHash)

	return int64(-1), err
}

func (op *OrderPersonal) PostTransaction()error {
    return nil
}

func (op *OrderPersonal) ReadRow(row *sql.Row) error {
	row.Scan(&op.Order_id, &op.Order_id_item, &op.UserHash,
		&op.FirstName, &op.SecondName, &op.SurName,
		&op.RoleHash, &op.RoleName)
	return nil
}

func (op *OrderPersonal) ReadRows(rows *sql.Rows) error {
	rows.Scan(&op.Order_id, &op.Order_id_item, &op.UserHash,
		&op.FirstName, &op.SecondName, &op.SurName,
		&op.RoleHash, &op.RoleName)
	return nil
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_PAYMENTS
func (op *OrderPayments)  SetOrderID(id int64){op.Order_id = id}
func (op *OrderPayments)  GetOrderID()int64{return op.Order_id}

func (op *OrderPayments) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){
	err := postgres.Requests.Insert(
		tx, table, type_parameter,
		op.Order_id, op.UserHash, op.TypePayments, op.Price, op.Time,
	)
	messageToWebSoc(table, op.Order_id)

	return int64(-1), err
}

func (op *OrderPayments) PostTransaction()error {
    return nil
}

func (op *OrderPayments) ReadRow(row *sql.Row) error {
	err := row.Scan(&op.Order_id, &op.UserHash, &op.TypePayments, &op.Price, &op.Time)

	return err
}

func (op *OrderPayments) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&op.Order_id, &op.UserHash, &op.TypePayments, &op.Price, &op.Time)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_STATUS
func (os *OrderStatus)  SetOrderID(id int64){os.Order_id = id}
func (os *OrderStatus)  GetOrderID()int64{return os.Order_id}

func (os *OrderStatus) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){
	var err error

	switch type_parameter {
	case "":
		err = postgres.Requests.Insert(
			tx, table, type_parameter,
			os.Order_id, os.Order_id_item, os.Cause,
			os.Status_id, os.UserHash, time.Now(),
		)
	case "Offline":
		err = postgres.Requests.Insert(
			tx, table, type_parameter,
			os.Order_id, os.Order_id_item, os.Cause,
			os.Status_id, os.UserHash, os.Time,
		)

	default:
		var id interface{}
		//row, err = postgres.Requests.InsertGetID(
		id, err = postgres.Requests.InsertGetID(
			tx, table, type_parameter,
			os.Order_id, os.Order_id_item, os.Cause,
			os.Status_id, os.UserHash, time.Now(),
		)

		if err == nil && id !=nil{
			messageToWebSoc(table, os.Order_id, id, os.Status_id)
		}
	}



	return nil, err
}

func (os *OrderStatus) PostTransaction()error {
    var err error
    if os.Status_id == 8 {
        s := postgres.Stream{}
        zero := 9999
        err2 := s.ReadRow("OrderList", "ValueNumberCountFinishedForOrder", os.Order_id, false)
        if err2 == nil {
            err2 = s.Row.Scan(&zero)
            if err2 == nil && zero == 0 {
                err2 := s.ReadRows("OrderList", "RangeOrderID", os.Order_id)
                if err2 == nil {
                    ol := OrderList{}
                    //var row2 *sql.Row
                    var id interface{}
                    //var id8 int
                    for s.Rows.Next() {
                        err2 = ol.ReadRows(s.Rows)
                        if err2 == nil {
                            id, err2 = postgres.Requests.InsertGetIDWithTransaction(
                                "OrderStatus", "GetID",
                                os.Order_id, ol.ID_item, "",
                                8, "system", time.Now(),
                            )
                            fmt.Println("ID:", id)
                            if err2 == nil && id != nil{
                                //err2 = row2.Scan(&id8)
                                //if err2 == nil {
                                messageToWebSoc("OrderStatus", os.Order_id, id, 8)
                                //}
                            }
                        }
                    }
                    id, err2 = postgres.Requests.InsertGetIDWithTransaction(
                        "OrderStatus", "GetID",
                        os.Order_id, 0, "",
                        8, "system", time.Now(),
                    )
                    if err2 == nil && id != nil{
                        //err2 = row2.Scan(&id)
                        //if err2 == nil {
                        //	messageToWebSoc(table, os.Order_id, 0, 8)
                        messageToWebSoc("OrderStatus", os.Order_id, 0, 8)
                        //}
                    }
                }
            }
        }
    }

    if os.Status_id == 14 {
        err2 := postgres.Requests.ExecTransact(
            "OrderStatus" + "GetID",
            os.Order_id, 0, os.Cause,
            os.Status_id, os.UserHash, time.Now(),
        )
        if err2 != nil {
            messageToWebSoc("OrderStatus", os.Order_id, 0, os.Status_id, time.Now())
        }
        s := postgres.Stream{}
        err2 = s.ReadRow("OrderList", "Value", os.Order_id, os.Order_id_item)
        if err2 == nil {
            orl := OrderList{}
            err2 = s.Row.Scan(
                &orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
                &orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
                &orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
                &orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
                &orl.Composition, &orl.Additionally, &orl.Packaging,
            )
            if err2 == nil {
                err2 = postgres.Requests.ExecTransact(
                    "OrderStatus"+ "GetID",
                    os.Order_id, orl.ID_item, os.Cause,
                    8, os.UserHash, time.Now(),
                )
                if err2 != nil {
                    messageToWebSoc("OrderStatus", os.Order_id, 0, os.Status_id, time.Now())
                }
            }
        }
    }

    if err != nil {
        println("================================")
        println("================================")
        println("================================")
        println(err.Error())

    }
    messageToWebSoc("OrderStatus", os.Order_id, os.Order_id_item, os.Status_id, time.Now())

    if os.Status_id == 9 && os.Order_id_item == 0 {
        println("Status_id == 9 && Order_id_item == 0")
        s := postgres.Stream{}
        err2 := s.ReadRow("Order", "ValueStringType", os.Order_id)
        if err2 == nil {
            println("err2 := s.ReadRow")
            var Types string
            err2 = s.Row.Scan(&Types)
            println("Types", Types)
            if strings.ToLower(Types) == "доставка" {
                println("strings.ToLower(Types)")
                err2 := s.ReadRow("Order", "ValueStringOrgHash", os.Order_id)
                if err2 == nil {
                    println("s.ReadRow")
                    var org_hash string
                    err2 = s.Row.Scan(&org_hash)
                    if err2 == nil {
                        println("s.Row.Scan(&org_hash)")
                        co := ClientOrder{IP: conf.Config.TLS_serv_session}
                        co.MSG = []byte("{\"Table\":\"SessionInfo\"," +
                                "\"Query\":\"Read\"," +
                                "\"TypeParameter\":\"OnOrganizationHashRoleHash\"," +
                                "\"Values\":[\"" + org_hash + "\",\"" + conf.Config.HashCourier + "\"]}")
                        co.Write()
	                    err2 = co.Err
                        if err2 == nil {
                            //var listen []byte
                            //var n int
                            s := Session{}
                            var as []Session
                            for {
                                //listen = make([]byte, 9999)
                                //n, err2 = co.Conn.Read(listen)
                                //if err==nil {
                                //	n, err2 = strconv.Atoi(string(listen))
                                //	if err == nil {
                                //		listen = make([]byte, n)
                                //		n, err2 = io.ReadFull(co.Conn, listen)
                                //	}
                                //}
                                co.Read()
	                            err2 = co.Err
                                if err2 != nil {
                                    break
                                }

                                if strings.ToUpper(strings.TrimSpace(string(co.ReadB))) == "01:EOF" {
                                    break
                                }
                                println("listen[:n]", string(co.ReadB))
                                err2 = json.Unmarshal(co.ReadB[3:], &s)
                                if err2 == nil {
                                    as = append(as, s)
                                }

                            }

                            var m map[string]CurierInfo
                            m = make(map[string]CurierInfo)
                            var f float64
                            var t time.Time
                            var maxi int
                            stream := postgres.Stream{}
                            for _, ss := range as {
                                //time|distance|status
                                println(ss.SessionData)
                                ars := strings.Split(ss.SessionData, "|")
                                if len(ars) < 4 {
                                    continue
                                }
                                f, err2 = strconv.ParseFloat(ars[1], 64)
                                if err2 == nil {
                                    if ars[2] == "true" {
                                        err2 = stream.ReadRow("OrderStatus", "ValueTimeEndActiveForUserHash", ss.UserHash)
                                        if err2 == nil {
                                            t = time.Now()
                                        }

                                        err2 = stream.Row.Scan(&t)
                                        if err2 != nil {
                                            println("Println:", err2.Error())
                                            t = time.Now()
                                        }
                                        maxi, err2 = strconv.Atoi(ars[3])
                                        if err2 == nil {
                                            println(maxi)
                                            m[ss.UserHash] = CurierInfo{ss: ss, Distance: f, Free: true, MaxOrder: maxi, LastActiveTime: t}
                                        }
                                    }
                                }
                            }
                            var minF float64
                            minF = math.MaxFloat64
                            t = time.Now()
                            var se string
                            var imax int
                            for ss, f := range m {
                                err2 = stream.ReadRow("OrderPersonal", "ValueNumberCountEmployment", f.ss.UserHash, time.Now().Format("2006-01-02"))
                                if err2 == nil {
                                    err2 = stream.Row.Scan(&imax)
                                    if err2 == nil {
                                        println("imax", imax)
                                        println("f.Distance < minF", f.Distance < minF)
                                        println("f.Distance < 1000", f.Distance < 1000)
                                        //println("f.LastActiveTime.Unix() <= t.Unix()", f.LastActiveTime.Unix(), t.Unix(), f.LastActiveTime.Unix() < t.Unix())
                                        println("f.Distance < minF", f.Distance, minF, f.Distance < minF)
                                        println("imax<f.MaxOrder", imax, f.MaxOrder, imax < f.MaxOrder)
                                        //println(f.Distance < minF && f.Distance < 1000 && f.LastActiveTime.Unix() < t.Unix() && imax < f.MaxOrder)
                                        println(f.Distance < minF && f.Distance < 1000 && imax < f.MaxOrder)

                                        //if f.Distance < minF && f.Distance < 1000 && f.LastActiveTime.Unix() <= t.Unix() && imax < f.MaxOrder {
                                        if f.Distance < minF && f.Distance < 1000 && imax < f.MaxOrder {
                                            println("Прошел проверку", ss)
                                            minF = f.Distance
                                            t = f.LastActiveTime
                                            se = ss
                                        }
                                    }
                                }
                                if err2 != nil {
                                    println("FOR GET KURYER", err.Error())
                                }
                            }
                            println("for _, ss := range as {")
                            for _, ss := range as {
                                if ss.UserHash == se {
                                    println("Назначили курьера:", se)
                                    err2 = postgres.Requests.ExecTransact(
                                        "OrderPersonal" + "",
                                        os.Order_id, os.Order_id_item, ss.UserHash,
                                        ss.FirstName, ss.SecondName, ss.SurName,
                                        ss.RoleHash, ss.RoleName,
                                    )
                                    if err2 != nil {
                                        println("===========================")
                                        println("===========================")
                                        println("===========================")
                                        println("===========================")
                                        println(err2.Error())

                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if os.Status_id == 11 && os.Order_id_item == 0 {
        var s postgres.Stream
        err2 := s.ReadRows("OrderList", "RangeOrderID", os.Order_id)
        if err2 == nil {
            orl := OrderList{}
            for s.Rows.Next() {
                println("for c.Rows.Next() {")
                err2 = orl.ReadRows(s.Rows)
                if err2 == nil {
                    err2 = s.ReadRow("Order", "ValueStringOrgHash", os.Order_id)
                    if err2 == nil {
                        var org_hash string
                        err2 = s.Row.Scan(&org_hash)
                        if err2 == nil {
                            //отправляем запрос на склад для списания
                            t := time.Now()

                            /*
                               Date time.Time
                               DateStr string
                               NameSklad string
                               OrgHash string
                               OrderID int64
                               Composition []ComprositionRashod
                               Product pq.Int64Array //Массив id на блюда
                               ProductName pq.StringArray //Название блюда
                               Operator string
                            */

                            c := ClientOrder{IP: conf.Config.TLS_serv_sklad,
                                MSG: []byte("{\"Table\":\"Rashod\",\"Query\":\"Create\"}" +
                                        "{\"Date\":\"" + t.String()[:10] + "T" + t.String()[11:19] + "Z\"" +
                                //",\"NameSklad\":\""+org_hash+"\"" +
                                        ",\"NameSklad\":\"Sklad\"" +
                                        ",\"OrgHash\":\"" + org_hash + "\"" +
                                        ",\"OrderID\":" + strconv.FormatInt(os.Order_id, 10) +
                                        ",\"Product\":[" + strconv.FormatInt(orl.Price_id, 10) +
                                        "],\"ProductName\":[\"" + orl.PriceName + "\"]" +
                                //",\"Operator\":\"operator\"}"),
                                        ",\"Operator\":\"" + os.UserHash + "\"}"),
                            }
                            c.Write()
                            //bs := make([]byte, 9999)
                            //c.Conn.Read(bs)
                            //var n int
                            //n, err2 = c.Conn.Read(bs)
                            //if err==nil {
                            //	n, err2 = strconv.Atoi(string(bs))
                            //	if err == nil {
                            //		bs = make([]byte, n)
                            //		n, err2 = io.ReadFull(c.Conn, bs)
                            //	}
                            //}
                            c.Read()
	                        err2 = c.Err
                            println("c.Conn.Read(bs)", string(c.ReadB))

                        }
                    }
                }
            }
        }
        s.Rows.Close()
    }

    if err == nil {
        if (os.Status_id == 15 || os.Status_id == 14 || os.Status_id == 5) && os.Order_id_item > 0 {
            println("--Если отменен со списанием или приготовлен или на переделке тогда отправляем на склад списать")
            //Если отменен со списанием или приготовлен или на переделке тогда отправляем на склад списать
            s := postgres.Stream{}
            //читаем хеш организации
            err2 := s.ReadRow("Order", "ValueStringOrgHash", os.Order_id)
            if err2 == nil {
                var org_hash string
                err2 = s.Row.Scan(&org_hash)
                if err2 == nil {
                    //Читаем элемент заказа
                    err2 = s.ReadRow("OrderList", "Value", os.Order_id, os.Order_id_item)
                    if err2 == nil {
                        orl := OrderList{}
                        err2 = s.Row.Scan(
                            &orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
                            &orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
                            &orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
                            &orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
                            &orl.Composition, &orl.Additionally, &orl.Packaging,
                        )
                        if err2 == nil {
                            err2 = s.ReadRow("OrderStatus", "ValueNumberIDOrdIDit",
                                os.Order_id, orl.ID_item,
                            )
                            if err2 == nil {
                                var status_id int64
                                s.Row.Scan(&status_id)
                                if status_id != int64(15) && status_id != int64(16) {
                                    oPer := OrderPersonal{}
                                    err2 = s.ReadRow("OrderPersonal", "Value", os.Order_id, os.Order_id_item, os.UserHash)

                                    if err2 == nil {
                                        err2 = s.Row.Scan(&oPer.Order_id, &oPer.Order_id_item, &oPer.UserHash, &oPer.FirstName, &oPer.SecondName, &oPer.SurName, &oPer.RoleHash, &oPer.RoleName)
                                        if err2 == nil {
                                            //отправляем запрос на склад для списания
                                            t := time.Now()
                                            c := ClientOrder{IP: conf.Config.TLS_serv_sklad,
                                                MSG: []byte("{\"Table\":\"Rashod\",\"Query\":\"Create\"}" +
                                                        "{\"Date\":\"" + t.String()[:10] + "T" + t.String()[11:19] + "Z\"" +
                                                        ",\"NameSklad\":" + org_hash +
                                                        ",\"NumberZakaz\":" + strconv.FormatInt(os.Order_id, 10) +
                                                        ",\"Product\":" + strconv.FormatInt(orl.Price_id, 10) +
                                                        ",\"ProductName\":" + orl.PriceName +
                                                        ",\"Operator\":\"" + os.UserHash + "\"" +
                                                        ",\"OperatorName \":\"" + oPer.FirstName + " " + oPer.SurName + "\"}"),
                                            }
                                            go c.Write()
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if err2 != nil {
                //log.Println("SEND SKLAD", err2)
                log.Println("SEND SKLAD", err2)
            }
        } else if (os.Status_id == 15 || os.Status_id == 16) && os.Order_id_item == 0 {
            //Если отменен без списания смотрим что готовится и отправляем списать
            println("--+++++++++++++++++++++++++++++++++++++++++++")
            println("--+++++++++++++++++++++++++++++++++++++++++++")
            println("--+++++++++++++++++++++++++++++++++++++++++++")
            println("--+++++++++++++++++++++++++++++++++++++++++++")
            println("--Если отменен без списания смотрим что готовится и отправляем списать")

            var s postgres.Stream
            err2 := s.ReadRows("OrderList", "RangeOrderID", os.Order_id)
            if err2 == nil {
                orl := OrderList{}
                for s.Rows.Next() {
                    println("for c.Rows.Next() {")
                    err2 = orl.ReadRows(s.Rows)
                    if err2 == nil {
                        err2 = s.ReadRow("OrderStatus", "ValueNumberIDOrdIDit",
                            os.Order_id, orl.ID_item,
                        )
                        var status_id int64
                        s.Row.Scan(&status_id)
                        if status_id == int64(15) || status_id == int64(16) {
                            continue
                        }
                        println("c.Row.Scan(&status_id)")
                        if err2 == nil {
                            if orl.TimeCook == 0 {
                                postgres.Requests.ExecTransact("OrderStatus" + "",
                                    os.Order_id, orl.ID_item, "", 16, "system", time.Now(),
                                )
                            } else {
                                println("Время готовки не равно нулю поэтому проверяем последний статус")

                                if status_id < int64(4) {
                                    println("Статус меньше 4 поэтому ставим без списания")
                                    err2 = postgres.Requests.ExecTransact("OrderStatus" + "FromSklad",
                                        os.Order_id, orl.ID_item, "", 16, "system", time.Now(),
                                    )
                                    messageToWebSoc("OrderStatus", os.Order_id, orl.ID_item, 16, time.Now())
                                } else {
                                    println("Статус больше 3 поэтому ставим списание")
                                    err2 = postgres.Requests.ExecTransact("OrderStatus" + "FromSklad",
                                        os.Order_id, orl.ID_item, "", 15, "system", time.Now(),
                                    )
                                    messageToWebSoc("OrderStatus", os.Order_id, orl.ID_item, 15, time.Now())
                                    if err2 == nil {
                                        err2 = s.ReadRow("Order", "ValueStringOrgHash", os.Order_id)
                                        if err2 == nil {
                                            var org_hash string
                                            err2 = s.Row.Scan(&org_hash)
                                            if err2 == nil {
                                                //отправляем запрос на склад для списания
                                                t := time.Now()

                                                /*
                                                   Date time.Time
                                                   DateStr string
                                                   NameSklad string
                                                   OrgHash string
                                                   OrderID int64
                                                   Composition []ComprositionRashod
                                                   Product pq.Int64Array //Массив id на блюда
                                                   ProductName pq.StringArray //Название блюда
                                                   Operator string
                                                */

                                                c := ClientOrder{IP: conf.Config.TLS_serv_sklad,
                                                    MSG: []byte("{\"Table\":\"Rashod\",\"Query\":\"Create\"}" +
                                                            "{\"Date\":\"" + t.String()[:10] + "T" + t.String()[11:19] + "Z\"" +
                                                    //",\"NameSklad\":\""+org_hash+"\"" +
                                                            ",\"NameSklad\":\"Sklad\"" +
                                                            ",\"OrgHash\":\"" + org_hash + "\"" +
                                                            ",\"OrderID\":" + strconv.FormatInt(os.Order_id, 10) +
                                                            ",\"Product\":[" + strconv.FormatInt(orl.Price_id, 10) +
                                                            "],\"ProductName\":[\"" + orl.PriceName + "\"]" +
                                                    //",\"Operator\":\"operator\"}"),
                                                            ",\"Operator\":\"" + os.UserHash + "\"}"),
                                                }
                                                c.Write()
                                                //bs := make([]byte, 9999)
                                                //c.Conn.Read(bs)
                                                //var n int
                                                //n, err2 = c.Conn.Read(bs)
                                                //if err==nil {
                                                //	n, err2 = strconv.Atoi(string(bs))
                                                //	if err == nil {
                                                //		bs = make([]byte, n)
                                                //		n, err2 = io.ReadFull(c.Conn, bs)
                                                //	}
                                                //}
                                                c.Read()
	                                            err2 = c.Err
                                                println("c.Conn.Read(bs)", string(c.ReadB))

                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            s.Rows.Close()
        }
    }

    return err
}


func (os *OrderStatus) ReadRow(row *sql.Row) error {
	err := row.Scan(&os.ID, &os.Order_id, &os.Order_id_item, &os.Cause,
		&os.Status_id, &os.UserHash, &os.Time)
	return err
}

func (os *OrderStatus) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&os.ID, &os.Order_id, &os.Order_id_item, &os.Cause,
		&os.Status_id, &os.UserHash, &os.Time)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----STATUS
func (s *Status)  SetOrderID(id int64){}
func (s *Status)  GetOrderID()int64{return 0}

func (s *Status) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){
	err := postgres.Requests.Insert(tx, table, type_parameter, s.Name)

	messageToWebSoc(table)

	return int64(-1), err
}

func (s *Status) PostTransaction()error {
    return nil
}
func (s *Status) ReadRow(row *sql.Row) error {
	err := row.Scan(&s.ID, &s.Name)
	return err
}

func (s *Status) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&s.ID, &s.Name)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----TypePayment
func (tp *TypePayment)  SetOrderID(id int64){}
func (tp *TypePayment)  GetOrderID()int64{return 0}

func (tp *TypePayment) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){
	err := postgres.Requests.Insert(tx, table, type_parameter, tp.Name)

	messageToWebSoc(table)

	return int64(-1), err
}

func (tp *TypePayment) PostTransaction()error {
    return nil
}

func (tp *TypePayment) ReadRow(row *sql.Row) error {
	err := row.Scan(&tp.ID, &tp.Name)
	return err
}

func (tp *TypePayment) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&tp.ID, &tp.Name)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----TimersCook
func (tc *TimersCook)  SetOrderID(id int64){}
func (tc *TimersCook)  GetOrderID()int64{return tc.Order_id}

func (tc *TimersCook) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){
	t := time.Now()
	err := postgres.Requests.Insert(tx, table, type_parameter, tc.Order_id, tc.Order_id_item, t, tc.Time_end, false)
	//qm.Values = append(qm.Values, tc.Order_id)
	messageToWebSoc(table, tc.Order_id, tc.Order_id_item, t)

	return int64(-1), err
}

func (tc *TimersCook) PostTransaction()error {
    return nil
}

func (tc *TimersCook) ReadRow(row *sql.Row) error {
	err := row.Scan(&tc.Order_id, &tc.Order_id_item, &tc.Time_begin, &tc.Time_end, &tc.Count, &tc.Finished)
	return err
}

func (tc *TimersCook) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&tc.Order_id, &tc.Order_id_item, &tc.Time_begin, &tc.Time_end, &tc.Count, &tc.Finished)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----CASH_BOX
func (c *Cashbox)  SetOrderID(id int64){c.Order_id = id}
func (c *Cashbox)  GetOrderID()int64{return c.Order_id}

func (c *Cashbox) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){
	println(c.Order_id)
	id, err := postgres.Requests.InsertGetID(tx, table, type_parameter, c.Order_id, c.Change_employee_id,
		c.First_sure_name, c.UserHash, c.RoleName, c.OrgHash, c.TypePayments, c.TypeOperation,
		c.Deposit, c.ShortChange, c.Cause, time.Now())
    fmt.Println("ID:", id)
	if err == nil && id != nil{
		//err = row.Scan(&c.ID)
		//if err == nil {
			messageToWebSocWithHashOrg(table, c.OrgHash, id, c.Order_id)
			p := CHPrint{}
			go p.Printer(id)

			return id, err
		//}
	}

	return nil, err
}

func (c *Cashbox) PostTransaction()error {
    return nil
}

func (c *Cashbox) ReadRow(row *sql.Row) error {
	err := row.Scan(&c.ID, &c.Order_id, &c.Change_employee_id,
		&c.First_sure_name, &c.UserHash, &c.RoleName, &c.OrgHash, &c.TypePayments, &c.TypeOperation,
		&c.Deposit, &c.ShortChange, &c.Cause, &c.TimeOperation)
	return err
}

func (c *Cashbox) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&c.ID, &c.Order_id, &c.Change_employee_id,
		&c.First_sure_name, &c.UserHash, &c.RoleName, &c.OrgHash, &c.TypePayments, &c.TypeOperation,
		&c.Deposit, &c.ShortChange, &c.Cause, &c.TimeOperation)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ChangeEmployee
func (ce *ChangeEmployee)  SetOrderID(id int64){}
func (ce *ChangeEmployee)  GetOrderID()int64{return 0}

func (ce *ChangeEmployee) Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error){
	mng := postgres.Requests
	id, err := mng.InsertGetID(tx, table, type_parameter, ce.UserHash, ce.OrgHash,
		ce.Sum_in_cashbox, ce.NonCash_end_day, ce.Cash_end_day, ce.Close, time.Now(), ce.Date_end,
	)
    fmt.Println("ID:", id)
    if err == nil && id != nil{
        return id, err
	}

	return nil, err
}

func (ce *ChangeEmployee) PostTransaction()error {
    return nil
}

func (ce *ChangeEmployee) ReadRow(row *sql.Row) error {
	err := row.Scan(&ce.ID, &ce.UserHash, &ce.OrgHash,
		&ce.Sum_in_cashbox, &ce.NonCash_end_day, &ce.Cash_end_day, &ce.Close, &ce.Date_begin, &ce.Date_end)
	return err
}

func (ce *ChangeEmployee) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&ce.ID, &ce.UserHash, &ce.OrgHash,
		&ce.Sum_in_cashbox, &ce.NonCash_end_day, &ce.Cash_end_day, &ce.Close, &ce.Date_begin, &ce.Date_end)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----PRINTER
type CHPrint struct {
	sp StructPrintable
}

func (p *CHPrint) init() {
	p.sp.Header = "\n    ДОСТАВКА ЗА 60 МИНУТ ИЛИ БЕСПЛАТНО \n" +
		"опоздаем - подарим сертификат на 600 руб."

	p.sp.InfoOrg = "         СЕТЬ РЕСТОРАНОВ \"ЯПОКИ\"\n " +
		"         OOO \"ВКУС БЕЗ ГРАНИЦ\"\n" +
		"Юр. адрес: 640011, Курган, Крылова, 14" +
		"      8 800 200 200 7 mail@yapoki.ru\n" +
		"     ИНН 4501195365 ОГРН 1144501004383"

	p.sp.Thanks = "            СПАСИБО ЗА ПОКУПКУ!"
	p.sp.Footer = "  Если Вы остались недовольны качеством \n обслуживания, " +
		"позвоните нам по телефону \n  горячей линии 8 800 200 200 7. Звонок \n" +
		"      бесплатный, даже с мобильного!"
}

//func (p *CHPrint) PrintAllRange(userHash string, tBegin, tEnd time.Time) {
func (p *CHPrint) PrintCountPriceWithDiscount(values ...interface{}) error {

	if len(values) < 1 {
		log.Println("CHPrint.PrintAllRange() LENGTH VALUES < 1")
		return errors.New("CHPrint.PrintAllRange() LENGTH VALUES < 1")
	}
	p.init()
	stream := postgres.Stream{}
	SumAll := int64(0)
	var Sum int64
	var err error
	p.sp.InfoOrg = p.sp.InfoOrg + "\n\n            ОТЧЕТ СУТОЧНЫЙ!"

	var v1 []interface{}
	for i, val := range values {
		if i == 0 {
			p.sp.OrgHash = fmt.Sprint(val)
		} else {
			v1 = append(v1, val)
		}
	}
	for i, typePay := range DBTypePayment {

		v := v1
		v = append([]interface{}{i}, v1...)

		println(i, typePay)
		if i < 3 {
			p.sp.Body = append(p.sp.Body, "          "+typePay)
			err = stream.ReadRow("Cashbox", "ValueNumberCountPriceWithDiscount", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					p.sp.Body = append(p.sp.Body, "Внесений:\t"+fmt.Sprint(Sum))
				} else {
					log.Println("Positive CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("Positive CASHBOX CHECK:", err)
				continue
			}

			err = stream.ReadRow("Cashbox", "ValueNumberSumNegative", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					p.sp.Body = append(p.sp.Body, "Изъятий:\t"+fmt.Sprint(Sum))
				} else {
					log.Println("Negative CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("Negative CASHBOX CHECK:", err)
				continue
			}

			err = stream.ReadRow("Cashbox", "ValueNumberSum", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					SumAll += Sum

					p.sp.Body = append(p.sp.Body, "Итого:\t\t"+fmt.Sprint(Sum))

				} else {
					log.Println("CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("CASHBOX CHECK:", err)
				continue
			}
		} else {
			break
		}
		p.sp.Body = append(p.sp.Body, "\n")

	}
	var b []byte
	if err == nil {
		p.sp.Body = append(p.sp.Body, "   ------------------------------------")
		p.sp.Body = append(p.sp.Body, "Всего:\t"+fmt.Sprint(SumAll))

		b, err = json.Marshal(p.sp)
		if err == nil {
			println("---------------------------------------------")
			println("---------------------------------------------")
			println(string(b))
			co := ClientOrder{IP: conf.Config.TLS_serv_printer}
			co.MSG = b
			co.Write()
			err = co.Err
		}
	}

	return err
}

func (p *CHPrint) PrintAllRange(values ...interface{}) error {

	if len(values) < 1 {
		log.Println("CHPrint.PrintAllRange() LENGTH VALUES < 1")
		return errors.New("CHPrint.PrintAllRange() LENGTH VALUES < 1")
	}
	p.init()
	stream := postgres.Stream{}
	SumAll := int64(0)
	var Sum int64
	var err error
	p.sp.InfoOrg = p.sp.InfoOrg + "\n\n            ОТЧЕТ СУТОЧНЫЙ!"

	var v1 []interface{}
	for i, val := range values {
		if i == 0 {
			p.sp.OrgHash = fmt.Sprint(val)
		} else {
			v1 = append(v1, val)
		}
	}
	for i, typePay := range DBTypePayment {

		v := v1
		v = append([]interface{}{i}, v1...)

		println(i, typePay)
		if i < 3 {
			p.sp.Body = append(p.sp.Body, "          "+typePay)
			err = stream.ReadRow("Cashbox", "ValueNumberSumPositive", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					p.sp.Body = append(p.sp.Body, "Внесений:\t"+fmt.Sprint(Sum))
				} else {
					log.Println("Positive CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("Positive CASHBOX CHECK:", err)
				continue
			}

			err = stream.ReadRow("Cashbox", "ValueNumberSumNegative", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					p.sp.Body = append(p.sp.Body, "Изъятий:\t"+fmt.Sprint(Sum))
				} else {
					log.Println("Negative CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("Negative CASHBOX CHECK:", err)
				continue
			}

			err = stream.ReadRow("Cashbox", "ValueNumberSum", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					SumAll += Sum

					p.sp.Body = append(p.sp.Body, "Итого:\t\t"+fmt.Sprint(Sum))

				} else {
					log.Println("CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("CASHBOX CHECK:", err)
				continue
			}
		} else {
			break
		}
		p.sp.Body = append(p.sp.Body, "\n")

	}
	var b []byte
	if err == nil {
		p.sp.Body = append(p.sp.Body, "   ------------------------------------")
		p.sp.Body = append(p.sp.Body, "Всего:\t"+fmt.Sprint(SumAll))

		b, err = json.Marshal(p.sp)
		if err == nil {
			println("---------------------------------------------")
			println("---------------------------------------------")
			println(string(b))
			co := ClientOrder{IP: conf.Config.TLS_serv_printer}
			co.MSG = b
			co.Write()
            err = co.Err
		}
	}
	if err != nil {
		log.Println("CASHBOX CHECK:", err)
	}
	return err
}

//func (p *CHPrint) Printer(id int64) {
func (p *CHPrint) Printer(values ...interface{}) error {
	//if len(values)<1{log.Println("CHPrint.Printer() LENGTH VALUES < 1");return }
	//id, err:=strconv.ParseInt(fmt.Sprint(values[0]), 10, 64)
	//if err != nil {log.Println("CHPrint.Printer()",err);return }
	p.init()
	println("func (p *Print) Printer(id int64) {")
	cashbox := Cashbox{}
	s := postgres.Stream{}
	s.ReadRow("Cashbox", "Value", values...)
	err := cashbox.ReadRow(s.Row)
	if err == nil {
		println("+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=")

		if cashbox.Order_id == 0 {
			//sp := StructPrintable{
			//	Header: "    ДОСТАВКА ЗА 60 МИНУТ ИЛИ БЕСПЛАТНО \n" +
			//			"приедем - подарим сертификат на 600 рублей",
			//	InfoOrg: "         СЕТЬ РЕСТОРАНОВ \"ЯПОКИ\"\n " +
			//			"         OOO \"ВКУС БЕЗ ГРАНИЦ\"\n" +
			//			"Юр. адрес: 640011, Курган, Крулова, 14" +
			//			"      8 800 200 200 7 mail@yapoki.ru\n" +
			//			"     ИНН 4501195365 ОГРН 114451004383",
			//	InfoCheck: cashbox.RoleName + ": " + cashbox.First_sure_name + " " + time.Now().String()[:19] + "\n" +
			//			"ДОК:" + fmt.Sprintf("%v", cashbox.ID) + " ЧЕК:" + fmt.Sprintf("%v", cashbox.ID) + "",
			//}
			//
			//sp.Price = fmt.Sprint(cashbox.Deposit)
			//sp.TypeOperation = cashbox.TypeOperation
			//sp.Thanks = "        СПАСИБО ЗА ПОКУПКУ!"
			//sp.Footer = "  Если Вы остались недовольны качеством \n обслуживания, " +
			//		"позвоните нам по телефону \n  горячей линии 8 800 200 200 7. Звонок \n      бесплатный, даже с мобильного!"
			//sp.OrgHash = sp.OrgHash
			//var b []byte
			//b, err = json.Marshal(sp)
			//if err == nil {
			//	println("---------------------------------------------")
			//	println("---------------------------------------------")
			//	println(string(b))
			//	co := ClientOrder{IP: conf.Config.TLS_serv_printer}
			//	co.MSG = b
			//	co.Write()
			//}
		} else {

			//var org_hash, discount_name, type_send, note, notecustomer string
			//var notecustomer string
			//var discount_percent st ring
			//var price, price_currency string
			//var price_with_discount float64

			stream := postgres.Stream{}
			order := Order{}
			err = stream.ReadRow("Order", "Value", cashbox.Order_id)
			if err == nil {
				println("err = stream.ReadRow(\"Order\"", cashbox.Order_id)
				//err = stream.Row.Scan(&org_hash, &discount_name, &type_send, &note, &notecustomer, &discount_percent, &price, &price_with_discount, &price_currency)
				err = order.ReadRow(stream.Row)
				if err == nil {
					println("err = stream.Row.Scan")
					err = stream.ReadRows("OrderList", "RangeOrderIDSet", cashbox.Order_id)
					if err == nil {
						println("err = stream.ReadRows(\"OrderList\"")
						p.sp.InfoCheck = cashbox.RoleName + ": " + cashbox.First_sure_name + "\n" +
							"ДОК:" + fmt.Sprintf("%v", cashbox.Order_id) + " ЧЕК:" + fmt.Sprintf("%v", cashbox.ID)+
                                "\n\tПринят: " + order.Order_time.String()[:19]

                                orl := OrderList{}
						var err3 error
						for stream.Rows.Next() {
							err3 = stream.Rows.Scan(&orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
								&orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
								&orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
								&orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
								&orl.Composition, &orl.Additionally, &orl.Packaging,
							)
							if err3 == nil {
								//p.sp.ItemOrders = append(p.sp.ItemOrders, orl.PriceName+"\t"+fmt.Sprintf("%v", (float64(orl.Price) - (float64(orl.Price) * (float64(orl.DiscountPercent) / 100)))))
								p.sp.Body = append(p.sp.Body, orl.PriceName+"\t"+fmt.Sprintf("%v", (float64(orl.Price)-(float64(orl.Price)*(float64(orl.DiscountPercent)/100))))+" "+order.PriceCurrency)
							}
						}
                        stream.Rows.Close()

						//p.sp.Body = append(p.sp.Body, "   ************************************")
						p.sp.Body = append(p.sp.Body, "   ------------------------------------")
						p.sp.Body = append(p.sp.Body, "Итого:\t"+fmt.Sprint(order.Price)+" "+order.PriceCurrency)
						//p.sp.Body = append(p.sp.Body, "Скидка:\t"+order.DiscountName+" "+fmt.Sprint(order.DiscountPercent)+"%")
						p.sp.Body = append(p.sp.Body, "Скидка:\t"+order.DiscountName)

						paid_off := float64(0)
						err = stream.ReadRow("Cashbox", "ValueNumberSumForOrder", cashbox.Order_id)
						if err == nil {
							err = stream.Row.Scan(&paid_off)
							if err == nil {
								paid_off -= cashbox.Deposit
								if paid_off > 0 {
									p.sp.Body = append(p.sp.Body, "Оплачено:\t"+fmt.Sprint(paid_off))
								}
							}
						}
						if err != nil {
							log.Println("Cashbox", err)
							err = nil
						}

						p.sp.Body = append(p.sp.Body, "   ------------------------------------")
						p.sp.Body = append(p.sp.Body, "Итого к оплате:\t"+fmt.Sprint(order.PriceWithDiscount-paid_off))
						if len(DBTypePayment[cashbox.TypePayments]) > 6 {
							p.sp.Body = append(p.sp.Body, DBTypePayment[cashbox.TypePayments]+":\t"+fmt.Sprint(cashbox.Deposit+cashbox.ShortChange))
						} else {
							p.sp.Body = append(p.sp.Body, DBTypePayment[cashbox.TypePayments]+":\t\t"+fmt.Sprint(cashbox.Deposit+cashbox.ShortChange))
						}
						p.sp.Body = append(p.sp.Body, "Сдача:\t\t"+fmt.Sprint(cashbox.ShortChange))

						//p.sp.Price = price
						//p.sp.Discount = append(p.sp.Discount, "Скидка: "+discount_name+" "+fmt.Sprint(discount_percent))
						//p.sp.PriceWithDiscount = "Итого:\t" + price_with_discount
						//p.sp.PriceCurrency = price_currency
						//p.sp.ShortChange = "Сдача:\t" + fmt.Sprint(cashbox.ShortChange)
						//p.sp.TypePayment = DBTypePayment[cashbox.TypePayments]
						//p.sp.TypeOperation = "Получено:\t" + fmt.Sprint(cashbox.Deposit)
						p.sp.OrgHash = order.OrgHash

                        err2 := stream.ReadRow("OrderCustomer", "Value", cashbox.Order_id)
                        if err2 == nil {
                            oc := OrderCustomer{}
                            err2 = oc.ReadRow(stream.Row)
                            if err2 == nil {
                                p.sp.Footer = p.sp.Footer +
                                    "\n   ------------------------------------\n"
                                if oc.NameCustomer != "" && oc.NameCustomer != " " {
                                    p.sp.Footer = p.sp.Footer +
                                            oc.NameCustomer
                                }

                                if oc.Phone != "" && oc.Phone != " " {
                                    p.sp.Footer = p.sp.Footer +
                                            " Телефон: " + oc.Phone
                                }

                                tp := TypePayment{}
                                err = stream.ReadRow("TypePayment","Value",order.TypePayments)
                                if err == nil{
                                    err = tp.ReadRow(stream.Row)
                                    if err == nil {
                                        p.sp.Footer = p.sp.Footer +
                                                "\nТип оплаты: " + tp.Name
                                    }
                                }
                                err = nil



                                if order.Type == "Доставка" {
                                    if oc.Street != "" && oc.Street != " " {
                                        p.sp.Footer = p.sp.Footer +
                                                "\nУлица: " + oc.Street
                                    }

                                    if oc.House > int64(0) {
                                        p.sp.Footer = p.sp.Footer +
                                                " Дом: " + fmt.Sprint(oc.House)
                                    }

                                    if oc.Apartment > int64(0) {
                                        p.sp.Footer = p.sp.Footer +
                                                " Квартира: " + fmt.Sprint(oc.Apartment)
                                    }

                                    if oc.Floor > int64(0) {
                                        p.sp.Footer = p.sp.Footer +
                                                " Этаж: " + fmt.Sprint(oc.Floor)
                                    }

                                    if oc.Building != "" && oc.Building != " " {
                                        p.sp.Footer = p.sp.Footer +
                                                " Строение: " + oc.Building
                                    }

                                    if oc.Entrance > int64(0) {
                                        p.sp.Footer = p.sp.Footer +
                                                "\nПодъезд: " + fmt.Sprint(oc.Entrance)
                                    }
                                }

                                var tf time.Time
                                if order.TimeDelivery.String()[:19]!=tf.String()[:19]{
                                    p.sp.Footer = p.sp.Footer +
                                            "\nПредзаказ на " + order.DatePreOrderCook.String()[:19]
                                }


                                if order.Note != "" && order.Note != " " {
                                    p.sp.Footer = p.sp.Footer +
                                            "\n" + order.Note
                                }


                                if oc.Note != "" && oc.Note != " " {
                                    p.sp.Footer = p.sp.Footer +
                                            "\n" + oc.Note
                                }
                            }
                        }
                        println(p.sp.Footer)
                        if err2!=nil{
                            println("err2: ", err2.Error())
                        }

						var b []byte
                        p.sp.Footer = p.sp.Footer + "\n\n\n\n\n"
						b, err = json.Marshal(p.sp)
						if err == nil {
							println("---------------------------------------------")
							println("---------------------------------------------")
							println(string(b))
							co := ClientOrder{IP: conf.Config.TLS_serv_printer}
							co.MSG = b
							co.Write()
                            err = co.Err
						}
					}
				}
			}
		}
	}

	if err != nil {
		println("Print err:", err.Error())
	}
	return err
}
