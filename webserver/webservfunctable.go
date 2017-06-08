package webserver

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"project/order/conf"
	"project/order/postgres"
	"project/order/structures"
	"strings"
	"time"
)

//----------------------------------------------------------------------------------------------------------------------
/*----INTERFACE_STRUCT----*/
type Structure interface {
	Read(qm *structures.QueryMessage, stream *postgres.Stream, conn net.Conn) error
	ReadeByteArray(stream *postgres.Stream, conn net.Conn) error
}

type Orders interface {
	Insert(qm *structures.QueryMessage) (int64, error)
	ReadRow(row *sql.Row) error
	ReadRows(rows *sql.Rows) error
}

//----------------------------------------------------------------------------------------------------------------------
/*----INTERFACE_STRUCT----*/
type structure struct {
	Client     *structures.ClientConn
	qm         structures.QueryMessage
	messOrder  interface{}
	row        *sql.Row
	orders     structures.Orders
	Structures structures.Structures
	ID         int64
}

//----------------------------------------------------------------------------------------------------------------------
/*----READ_FOR_TABLE----*/
//----ORDER

func (st *structure) send(p []byte, err error) {
	if err == nil {
		p = append([]byte("01:"+st.qm.ID_msg+"{"), p...)
	} else {
		p = append([]byte("00:"+st.qm.ID_msg+"{"), p...)
		p = append(p, []byte(err.Error())...)
	}
	println("SEND TO", st.Client.IP.String(), ":", string(p))
	st.Client.Send <- p

	/*if st.Client.conn != nil {
		println("SEND MESS: ", string(p))
		if err2 := st.Client.conn.WriteMessage(1, p); err2 != nil {
			println(err2.Error())
		}

		println("-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+")
	}*/
}

//-----------------------------------------------------------------------------
func (st *structure) SelectTables(msg []byte) error {

	imsg := strings.Index(string(msg), "}")
	err := json.Unmarshal([]byte(msg[:imsg+1]), &st.qm)
	if err != nil {
		println("no marshaling")
		return errors.New("ERROR MARSHAL_STRUCT_TABLE")
	}



	st.Structures.QM =  &st.qm

	if len(msg) < imsg+2 {
		switch st.qm.Query {
		case "Update":
			all := structures.All{}
			err = all.Update(&st.qm)
			if err == nil {
				st.send([]byte(st.qm.Query+": it is no problem"), nil)
			}
			//if err == nil {
			//	st.send([]byte(st.qm.Table+" NO ERRORS "+st.qm.Query+", TYPE PARAMETERS: \""+st.qm.TypeParameter+"\""), nil)
			//}
			break
		case "Delete":
			all := structures.All{}
			err = all.Delete(&st.qm)
			if err == nil {
				st.send([]byte(st.qm.Query+": it is no problem"), nil)
			}
			break
		}

		if st.qm.Query != "Read" && st.qm.Table != "ProductOrder" && st.qm.Table != "GetPoint" && st.qm.Table != "GetAreas" &&
			st.qm.Table != "Session" && st.qm.Table != "SessionInfo" && st.qm.Table != "Tabel" && st.qm.Table != "ClientInfo" && st.qm.Table != "LocalTime" &&
			st.qm.Table != "Printer" && st.qm.Table != "GroupUser" {
			//for _, item := range conf.Config.TLS_serv_reader {
			//	ClientOrder := structures.ClientOrder{IP: item, MSG: msg}
			//	go ClientOrder.Write()
			//}
			return err
		}

		if err != nil {
			return err
		}
	}

	switch st.qm.Table {
	case "Order":
		st.orders = &structures.Order{}
		break

	case "OrderCustomer":
		st.orders = &structures.OrderCustomer{}
		break

	case "OrderList":
		st.orders = &structures.OrderList{}
		break

	case "OrderPersonal":
		st.orders = &structures.OrderPersonal{}
		break

	//case "OrderPayments":
	//	st.orders = &structures.OrderPayments{}

	case "OrderStatus":
		st.orders = &structures.OrderStatus{}
		break

	case "Cashbox":
		st.orders = &structures.Cashbox{}
		break

	case "ChangeEmployee":
		st.orders = &structures.ChangeEmployee{}
		break

	case "Status":
		st.orders = &structures.Status{}
		break

	case "TypePayment":
		st.orders = &structures.TypePayment{}
		break

	case "TimersCook":
		st.orders = &structures.TimersCook{}
		break

	case "LocalTime":
		st.send([]byte(time.Now().String()[11:19]), nil)
		return nil

	case "Printer":
		println("Printer", fmt.Sprint(st.qm.Values))
		printer := structures.CHPrint{}
		switch st.qm.TypeParameter {
		case "":
			go func() {
				err = printer.Printer(st.qm.Values...)
				if err != nil {
					st.send([]byte(""), err)
				}
			}()

		case "AllRange":
			go func() {
				err = printer.PrintAllRange(st.qm.Values...)
				if err != nil {
					st.send([]byte(""), err)
				}
			}()
			break

		case "CountPriceWithDiscount":
			go func() {
				err = printer.PrintCountPriceWithDiscount(st.qm.Values...)
				if err != nil {
					st.send([]byte(""), err)
				}
			}()
			break
		}
		return nil

	case "ProductOrder":
		/*
			Table:PromotionsTypes
			Table:Promotions

			Table:Subjects
		*/
		//----получение продуктов и передача их в веб сокет
		co := structures.ClientOrder{IP: conf.Config.TLS_serv_product}
		switch st.qm.TypeParameter {
		case "":
			co.MSG = []byte("{\"Table\":\"ProductOrder\",\"Query\":\"Read\"}")
			break

		case "PromotionsTypes":
			co.MSG = []byte("{\"Table\":\"PromotionsTypes\",\"Query\":\"Read\",\"Limit\":999}")
			break

		case "Promotions":
			co.MSG = []byte("{\"Table\":\"Promotions\",\"Query\":\"Read\",\"Limit\":999}")
			break

		case "Subjects":
			co.MSG = []byte("{\"Table\":\"Subjects\",\"Query\":\"Read\",\"Limit\":999}")
			break

		case "OrgHash":
			/*
				OP := structures.OrgProd{}
				Q := structures.QueryMessage{
					Table: "ProductOrder",
					Query: "Read",
					TypeParameter: "OrgHash"}
				Q.Values = append(Q.Values, "Org1")
			*/
			co.MSG = []byte("{\"Table\":\"ProductOrder\",\"Query\":\"Read\"," +
				"\"TypeParameter\":\"" + st.qm.TypeParameter + "\"," +
				"\"Values\":[\"" + fmt.Sprintf("%v", st.qm.Values[0]) + "\"]}")
			break
		}

		//err = st.getDateWithServicesRangeRead(co)
		go st.getDateWithServicesRangeRead(co)

		return err

	case "GroupUser"://GlobalParameters

		co := structures.ClientOrder{IP: conf.Config.TLS_serv_GlobalParameters}
		co.MSG,err = json.Marshal(st.qm)
        if err == nil {
            co.MSG = append(co.MSG, []byte(msg[imsg+1:])...)
        }

		go st.getDateWithServicesRangeRead(co)
		return err

	case "ClientInfo":
		co := structures.ClientOrder{IP: conf.Config.TLS_serv_ClientInfo}
		switch st.qm.TypeParameter {
		case "Create":
			co.MSG = []byte("{\"Table\":\"ClientInfo\",\"Query\":\"Create\"," +
				"\"TypeParameter\":\"Operator\"}")
			co.MSG = append(co.MSG, []byte(msg[imsg+1:])...)
			break

		case "Update":
			co.MSG = []byte("{\"Table\":\"ClientInfo\",\"Query\":\"Update\"," +
				"\"TypeParameter\":\"Operator\"" + fmt.Sprintf("%v", st.qm.Values[0]))
			break

		case "ReadClient":
			co.MSG = []byte("{\"Table\":\"ClientInfo\",\"Query\":\"Read\"," +
				"\"TypeParameter\":\"Phone\"," +
				"\"Values\":[\"" + fmt.Sprintf("%v", st.qm.Values[0]) + "\"]}")
			break

		case "CreateAddress":
			co.MSG = []byte("{\"Table\":\"ClientOrdersAddress\",\"Query\":\"Create\"," +
				"\"TypeParameter\":\"Operator\"}")
			co.MSG = append(co.MSG, []byte(msg[imsg+1:])...)
			break

		case "ReadAddress":
			co.MSG = []byte("{\"Table\":\"ClientOrdersAddress\",\"Query\":\"Read\"," +
				"\"TypeParameter\":\"Phone\"," +
				"\"Values\":[\"" + fmt.Sprintf("%v", st.qm.Values[0]) + "\"],\"Limit\":999}")
			//err = st.getDateWithServicesRangeRead(co)
			//go func() {
			//	st.clientListRWMutex.Lock()
			//	st.getDateWithServicesRangeRead(co)
			//   st.clientListRWMutex.Unlock()
			//}()
			//err = st.getDateWithServicesRangeRead(co)
			go st.getDateWithServicesRangeRead(co)
			return err
		default:
			return nil
		}

		//err = st.getDateWithServicesValueRead(co)
		go st.getDateWithServicesValueRead(co)
		return err

	case "Session":
        co := structures.ClientOrder{IP: conf.Config.TLS_serv_session}
        co.MSG,err = json.Marshal(st.qm)
        if err != nil {return err}
        co.MSG = append(co.MSG, []byte(msg[imsg+1:])...)

        go st.getDateWithServicesValueRead(co)

        return nil

	case "SessionInfo":
		co := structures.ClientOrder{IP: conf.Config.TLS_serv_session}
        co.MSG,err = json.Marshal(st.qm)
        if err != nil {return err}
        co.MSG = append(co.MSG, []byte(msg[imsg+1:])...)

        if st.qm.TypeParameter =="OnOrganizationHashRoleHash"{
            go st.getDateWithServicesRangeRead(co)
        }else{
            go st.getDateWithServicesValueRead(co)
        }

		return nil

	case "Tabel":
		co := structures.ClientOrder{IP: conf.Config.TLS_serv_tabel}
		co.MSG = []byte("{\"Table\":\"PlanJobTime\",\"Query\":\"\"," +
			"\"TypeParameter\":\"\"," +
			"\"Values\":[\"" + fmt.Sprintf("%v", st.qm.Values[0]) + "\"]}")

		//err = st.getDateWithServicesValueRead(co)
		go st.getDateWithServicesValueRead(co)
		return err

	case "GetAreas":
		//---------------------------
		//{"Table":"GetAreas","TypeParameter":"WithHouse","Values":["Курган","Кирова","34"],"ID_msg":"delivzone"}

		co := structures.ClientOrder{IP: conf.Config.TLS_serv_areas}
		switch st.qm.TypeParameter {
		case "WithHouse":
			co.MSG = []byte("{\"City\":\"" + fmt.Sprintf("%v", st.qm.Values[0]) + "\"," +
				"\"Street\":\"" + fmt.Sprintf("%v", st.qm.Values[1]) + "\"," +
				"\"House\":\"" + fmt.Sprintf("%v", st.qm.Values[2]) + "\"}")
			break

		case "NotWithHouse":
			co.MSG = []byte("{\"City\":\"" + fmt.Sprintf("%v", st.qm.Values[0]) + "\"," +
				"\"Street\":\"" + fmt.Sprintf("%v", st.qm.Values[1]) + "\"}")
			break
		}

		//err = st.getDateWithServicesRangeRead(co)
		go st.getDateWithServicesRangeRead(co)

		return err

	case "GetPoint":
		//Q := structures.QueryMessage{}
		//Q.Table, Q.Query, Q.TypeParameter = "Point", "Select", "AllCity"
		//Bytes1, _ := json.Marshal(Q)
		//message := string(Bytes1) + "Курган"
		//println(string(message))
		if len(st.qm.Values) > 0 {
			co := structures.ClientOrder{IP: conf.Config.TLS_serv_org,

				MSG: []byte("{\"Table\":\"Point\",\"Query\":\"Select\"," +
					"\"TypeParameter\":\"AllCity\",\"Values\":[\""+fmt.Sprintf("%v", st.qm.Values[0])+"\"]}"),
			}
			//err = st.getDateWithServicesRangeRead(co)
			go st.getDateWithServicesRangeRead(co)
		} else {
			st.send([]byte(""), errors.New("NEED MORE ARGUMENTS"))
		}

		return err
	default:
		return errors.New("ERROR NOT IDENTIFICATION TYPE TABLE")
	}
	st.Structures.Orders = st.orders


    if len(st.qm.TypeParameter) < 5 && st.qm.Query == "Read" {
        return errors.New("Length name type parameter does not satisfy the requirement")
    }

	switch st.qm.Query {
	case "Create":
		err = json.Unmarshal([]byte(msg[imsg+1:]), &st.orders)
		if err == nil {
			var id interface{}
			//id, err = st.orders.Insert(&st.qm)
            println("Я не умею создавать записи в бд")
			if err == nil {
				println(st.ID)
				if st.ID != int64(-1) {
					st.send([]byte(fmt.Sprint(id)), nil)
				} else {
					st.send([]byte(st.qm.Table+" NO ERRORS "+st.qm.Query+", TYPE PARAMETERS: \""+st.qm.TypeParameter+"\""), nil)
				}

				//for _, item := range conf.Config.TLS_serv_reader {
				//	ClientOrder := structures.ClientOrder{IP: item, MSG: msg}
				//	go ClientOrder.Write()
				//}
			} else {
				println("no work insert", err.Error())
			}
		}
		break

	case "Read":
		err = st.Structures.QueryRead()
		if err != nil {
			return err
		}
		switch st.qm.TypeParameter[:5] {
		case "Value":
			err = st.Structures.Read()
            if err == nil {
                st.send(st.Structures.Buf, err)
            }


			//if st.qm.TypeParameter == "Value" {
			//	err = st.orders.ReadRow(st.stream.Row)
			//	if err == nil {
			//		mess, err := json.Marshal(st.orders)
			//		if err == nil {
			//			st.send(mess, nil)
			//		}
			//	}
			//} else {
			//	err = st.Read()
			//}
			break
		case "Range":
			b:=true

			for b{
                b, err = st.Structures.ReadRows()
                if err == nil && b == true{
                    st.send(st.Structures.Buf, err)
                }else{
                    break
                }
			}

			st.send([]byte("EOF"), nil)


			//if st.stream.Rows == nil {
			//	st.send([]byte("EOF"), nil)
			//} else {
			//	for st.stream.Rows.Next() {
			//		err = st.orders.ReadRows(st.stream.Rows)
			//		if err == nil {
			//			var mess []byte
			//			mess, err = json.Marshal(st.orders)
			//			if err == nil {
			//				st.send(mess, nil)
			//			}
			//		}
			//	}
			//}
			//
			//st.send([]byte("EOF"), nil)
			//go st.stream.Rows.Close()
			break
		default:
			return errors.New("NOT IDENTIFICATION TYPE READ")
		}
		break

	default:
		return errors.New("NOT IDENTIFIQTION QUERYS")
	}
	return err
}

//var listen = make([]byte,16384)

func (st *structure) getDateWithServicesValueRead(co structures.ClientOrder) error {
	var n int
	err := co.Write()
	//Если при отправки сообщения нет ошибок идем дальше
	if err == nil && co.Conn != nil {
		//var listen [5000]byte
		listen := make([]byte, 9999)
		//Читаем первые 4-ре символа

		listen, n, err = co.Read()
		if err != nil {
			println("getDateWithServicesRangeRead READ:", err.Error())
			return err
		}

		if strings.ToUpper(strings.TrimSpace(string(listen[:n]))) == "01:EOF" {
			println("+++++++++++++++")
			println("BREAK")
			println("---------------")

			return err
		}

		if string(listen[:2]) == "01" {
			st.send(listen[3:n], nil)
		} else {
			//st.send(listen[3:n], errors.New(""))
			log.Println("ERROR get message", co.Conn.RemoteAddr(), ":", listen[:n])
			return err
		}
	}
	if err != nil {
		st.send([]byte(""), err)
		println(err.Error())
	}
	return err
}

func (st *structure) getDateWithServicesRangeRead(co structures.ClientOrder) error {

	var n int
	err := co.Write()

	if err == nil {
		var listen []byte
		for {
			listen = make([]byte, 9999)

			listen, n, err = co.Read()
			if err != nil {
				println("getDateWithServicesRangeRead READ:", err.Error())
				break
			}

			if strings.ToUpper(strings.TrimSpace(string(listen[:n]))) == "01:EOF" {
				println("+++++++++++++++")
				println("BREAK")
				println("---------------")

				break
			}

			if string(listen[:2]) == "01" {
				st.send(listen[3:n], nil)
			} else {
				//st.send(listen[3:n], errors.New(""))
				log.Println("ERROR get message", co.Conn.RemoteAddr(), ":", listen[:n])
				break
			}

			time.Sleep(10)
		}
		st.send([]byte("EOF"), nil)
	} else {
		st.send([]byte(""), err)
	}

	if co.Conn != nil {
		co.Conn.Close()
	}
	return nil
}
