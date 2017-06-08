package server

//import (
//	"encoding/json"
//	"errors"
//	"log"
//	"project/orders/structures"
//	"strconv"
//	"strings"
//)
//
////----------------------------------------------------------------------------------------------------------------------
///*----INTERFACE_STRUCT----*/
////type structure struct {
////	conn       net.Conn
////	qm         structures.QueryMessage
////	row        *sql.Row
////	orders     structures.Orders
////	message    structures.Message
////	Structures structures.Structures
////	ID         int64
////	Send       *chan []byte
////	//Reads  structures.Read
////	//stream *postgres.Stream
////}
//
////-----------------------------------------------------------------------------
//func (st *ClientTLS) SelectTables(msg []byte) error {
//
//	var err error
//	imsg := strings.Index(string(msg), "}")
//	err = json.Unmarshal([]byte(msg[:imsg+1]), &st.qm)
//	if err != nil {
//		return errors.New("ERROR MARSHAL_STRUCT_TABLE")
//	}
//
//	if len(st.qm.TypeParameter) < 5 && st.qm.Query == "Read" {
//		return errors.New("Length type parameter does not satisfy the requirement")
//	}
//
//	st.Structures.QM = &st.qm
//
//	if len(msg) < imsg+2 {
//
//		switch st.qm.Query {
//		case "Update":
//			all := structures.All{}
//			err = all.Update(&st.qm)
//			if err == nil {
//				st.send([]byte(st.qm.Table+" NO ERRORS "+st.qm.Query+", TYPE PARAMETERS: \""+st.qm.TypeParameter+"\""), nil)
//			}
//		case "Delete":
//			all := structures.All{}
//			err = all.Delete(&st.qm)
//			if err == nil {
//				st.send([]byte(st.qm.Table+" NO ERRORS "+st.qm.Query+", TYPE PARAMETERS: \""+st.qm.TypeParameter+"\""), nil)
//			}
//		}
//
//		//for _, item := range conf.Config.TLS_serv_reader {
//		//   ClientOrder := structures.ClientOrder{IP:item,MSG:msg}
//		//   go ClientOrder.Write()
//		//}
//
//		if err != nil {
//			return err
//		}
//
//		if st.qm.Query != "Read" {
//			return err
//		}
//	}
//
//	switch st.qm.Table {
//	case "Order":
//		st.orders = &structures.Order{}
//		break
//
//	case "OrderCustomer":
//		st.orders = &structures.OrderCustomer{}
//		break
//
//	case "OrderList":
//		st.orders = &structures.OrderList{}
//		break
//
//	case "OrderPersonal":
//		st.orders = &structures.OrderPersonal{}
//		break
//
//	case "OrderPayments":
//		st.orders = &structures.OrderPayments{}
//		break
//
//	case "OrderStatus":
//		st.orders = &structures.OrderStatus{}
//		break
//
//	case "Cashbox":
//		st.orders = &structures.Cashbox{}
//		break
//
//	case "ChangeEmployee":
//		st.orders = &structures.ChangeEmployee{}
//		break
//
//	case "Status":
//		st.orders = &structures.Status{}
//		break
//
//	case "TypePayment":
//		st.orders = &structures.TypePayment{}
//		break
//
//	case "TimersCook":
//		st.orders = &structures.TimersCook{}
//		break
//
//	case "ProductOrder":
//		//Тут рассылка по вебьсокетам
//		st.messageToWebSoc(msg)
//		return nil
//	default:
//		return errors.New("ERROR NOT IDENTIFICATION TYPE TABLE")
//	}
//	st.Structures.Orders = st.orders
//
//	switch st.qm.Query {
//	case "Create":
//
//		err = json.Unmarshal([]byte(msg[imsg+1:]), &st.orders)
//		if err == nil {
//			st.ID, err = st.orders.Insert(&st.qm)
//			if err == nil {
//				if st.ID != int64(-1) {
//					st.send([]byte(strconv.FormatInt(st.ID, 10)), nil)
//				} else {
//					st.send([]byte(st.qm.Table+" NO ERRORS "+st.qm.Query+", TYPE PARAMETERS: \""+st.qm.TypeParameter+"\""), nil)
//				}
//
//				//for _, item := range conf.Config.TLS_serv_reader {
//				//	ClientOrder := structures.ClientOrder{IP: item, MSG: msg}
//				//	go ClientOrder.Write()
//				//}
//			}
//		}
//	case "Read":
//		err = st.Structures.QueryRead()
//		if err != nil {
//			return err
//		}
//		switch st.qm.TypeParameter[:5] {
//		case "Value":
//			err = st.Structures.Read()
//			if err == nil {
//				st.send(st.Structures.Buf, err)
//			}
//
//			//if st.qm.TypeParameter == "Value" {
//			//	err = st.orders.ReadRow(st.stream.Row)
//			//	if err == nil {
//			//		mess, err := json.Marshal(st.orders)
//			//		if err == nil {
//			//			st.send(mess, nil)
//			//		}
//			//	}
//			//} else {
//			//	err = st.Read()
//			//}
//			break
//		case "Range":
//			b := true
//
//			for b {
//				b, err = st.Structures.ReadRows()
//				if err == nil && b == true {
//					st.send(st.Structures.Buf, err)
//				} else {
//					break
//				}
//			}
//			st.send([]byte("EOF"), nil)
//
//			//if st.stream.Rows == nil {
//			//	st.send([]byte("EOF"), nil)
//			//} else {
//			//	for st.stream.Rows.Next() {
//			//		err = st.orders.ReadRows(st.stream.Rows)
//			//		if err == nil {
//			//			var mess []byte
//			//			mess, err = json.Marshal(st.orders)
//			//			if err == nil {
//			//				st.send(mess, nil)
//			//			}
//			//		}
//			//	}
//			//}
//			//
//			//st.send([]byte("EOF"), nil)
//			//go st.stream.Rows.Close()
//			break
//		default:
//			return errors.New("NOT IDENTIFICATION TYPE READ")
//		}
//	default:
//		return errors.New("NOT IDENTIFIQTION QUERYS")
//	}
//	return err
//}
//
//func (s *ClientTLS) messageToWebSoc(msg []byte) {
//	cl := structures.ClientList
//	msg = append([]byte("02:{"), msg...)
//	var err error
//	for _, c := range cl {
//		c.Send <- msg
//		//if c.conn !=nil{
//		//	err = c.conn.WriteMessage(1,msg)
//		//}
//	}
//
//	if err != nil {
//		log.Println(err.Error())
//	}
//}
