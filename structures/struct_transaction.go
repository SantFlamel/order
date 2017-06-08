package structures

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"project/order/postgres"
	"sync"
    "strconv"
    "project/order/conf"
    "log"
)

//import "project/orders/structures"
var GuardClientTrans *sync.RWMutex

type StructTransact struct {
	orders  Orders
	buf     []byte
	row     *sql.Row
	rows    *sql.Rows
	result  sql.Result
	Message *Message
}

func init() {
	GuardClientTrans = &sync.RWMutex{}
}
func (st *StructTransact) init_order(NameTable string) error {
	switch NameTable {
	case "Order":
		st.orders = &Order{}
		break

	case "OrderCustomer":
		st.orders = &OrderCustomer{}
		break

	case "OrderList":
		st.orders = &OrderList{}
		break

	case "OrderPersonal":
		st.orders = &OrderPersonal{}
		break

	case "OrderPayments":
		st.orders = &OrderPayments{}
		break

	case "OrderStatus":
		st.orders = &OrderStatus{}
		break

	case "Cashbox":
		st.orders = &Cashbox{}
		break

	case "ChangeEmployee":
		st.orders = &ChangeEmployee{}
		break

	case "TimersCook":
		st.orders = &TimersCook{}
		break

	case "ProductOrder":
		break
		//return nil
	default:
		println("ERROR(StructTransact) NOT IDENTIFICATION TABLE: " + NameTable)
		return errors.New("ERROR(StructTransact) NOT IDENTIFICATION TABLE: " + NameTable)
	}
	return nil
}

//----Вставка в базу данных
func (st *StructTransact) Insert() (Message, error) {
	GuardClientTrans.Lock()
	defer GuardClientTrans.Unlock()


    //----Переменные для отправки
    m := Message{}
    t := Table{}
    m.Query = st.Message.Query

	//----Создаем транзацию
	tx, err := postgres.DB.Begin()
	if err != nil {
		println(err.Error())
		return m, err
	}

	//----Возвращаем все как было
	defer tx.Rollback()

	var ok bool
	var buf_id interface{}
	var buf_id_post interface{}
    var order_id int64

	for i, table := range st.Message.Tables {
        //----Инициализируем таблицу для отправки данных
        t.TypeParameter = table.TypeParameter
        t.Name = table.Name
        t.Values  =  make([]interface{},0)

		//----Инициализируем структуру для работы с ней
		err = st.init_order(table.Name)
		if err != nil {
			return m, err
		}
		//----Проверяем на существоание запрос
		_, ok = postgres.Requests.RequestsList["execInsert" + table.Name + table.TypeParameter]
		if !ok {
			return m, errors.New("sql Missmath request in request insert")
		}

		println("Перебираем таблицы")
        //----Перебираем таблицы
		for ii, StructTable := range table.Values {
            //----Маршалим что бы смогли получить данные для структуры с меньшей вероятности вылета программы
			st.buf, err = json.Marshal(StructTable)
            t = table
            t.Values = nil

			if err == nil {
                //----Передаем json в структуру
				err = json.Unmarshal(st.buf, &st.orders)
				if err == nil {
                    if buf_id != nil {
                        var err error
                        order_id, err = strconv.ParseInt(fmt.Sprint(buf_id), 10, 64)
                        if err!=nil{println(err.Error());return m, err}
                        st.orders.SetOrderID(order_id)
                    }


					if table.TypeParameter == "GetID" && ii == 0 && i == 0 {
                        println("GetID")
                        buf_id, err = st.orders.Insert(table.Name, table.TypeParameter, tx)
                        t.Values = append(t.Values,buf_id)
						if buf_id == nil {
							println("i am nil")
						}else {
                            fmt.Println("buf_int:",buf_id)
                        }
                    }else if table.TypeParameter == "GetID"{
                        buf_id_post, err = st.orders.Insert(table.Name, table.TypeParameter, tx)
                        t.Values = append(t.Values,buf_id_post)
					} else {
						_, err = st.orders.Insert(table.Name, table.TypeParameter, tx)
					}
				}
                m.Tables = append(m.Tables,t)
			}
			if err != nil {
				println(err.Error())
				return m, err
			}


		}

	}

    //----Пименяем изменения
	err = tx.Commit()
    for _, table := range st.Message.Tables {
        //----Инициализируем структуру для работы с ней
        err = st.init_order(table.Name)
        if err != nil {
            return m, err
        }
        err = st.orders.PostTransaction()
        if err != nil {
            return m, err
        }
    }
    go st.messageToWebSocTrans(&m,buf_id)
	return m, err
}


//----Обновление в базе данных
func (st *StructTransact) Update() error {
	GuardClientTrans.Lock()
	defer GuardClientTrans.Unlock()

	//Создаем транзацию
	tx, err := postgres.DB.Begin()
	if err != nil {
		println(err.Error())
		return err
	}
	//Откатываем транзакцию
	defer tx.Rollback()

	for _, table := range st.Message.Tables {
		if err = postgres.Requests.CheckRequest("execUpdate" + table.Name + table.TypeParameter); err != nil {
			return err
		}
		_, err = tx.Stmt(postgres.Requests.RequestsList["execUpdate"+table.Name+table.TypeParameter]).Exec(table.Values...)
		if err != nil {
			return err
		}

	}

    //----Пименяем изменения
    err = tx.Commit()
    if err != nil {
        return err
    }

	return nil
}

func (st *StructTransact) ReadeByteArray() error {
	err := st.row.Scan(&st.buf)
	if err != nil {
		return err
	}
	return nil
}

//----Чтение строки из базы данных
func (st *StructTransact) Read() (Message,error) {
	m := Message{}
	t := Table{}
	var err error
	m.Query = st.Message.Query

	//----Перебираем запросы
	for _, table := range st.Message.Tables {
        err = st.init_order(table.Name)
        if err!=nil{
            return m,err
        }
		//----Проверяем на существоание запроса
		if err = postgres.Requests.CheckRequest("queryRead" + table.Name + table.TypeParameter); err != nil {
			return m,err
		}



		if len(table.TypeParameter)<5{return m,errors.New("par The length of the parameter type does not satisfy the requirements of")}
        switch table.TypeParameter[:5] {
        case "Value":
            //----выполняем запрос
            st.row = postgres.Requests.RequestsList["queryRead"+table.Name+table.TypeParameter].QueryRow(table.Values...)

            //----Считываем полученны данные
            if table.TypeParameter == "Value" {
                err = st.orders.ReadRow(st.row)
                t.Values = append(t.Values, st.orders)
            } else {
                //----Длинна слова типа параметра не может быть меньше шести
                if len(table.TypeParameter) < 6 {
                    return m,errors.New("par The length of the parameter type does not satisfy the requirements of")
                }
                switch table.TypeParameter[5:11] {
                case "String":
                    err = st.ReadeByteArray()
                    t.Values = append(t.Values, st.buf)

                case "Boolea":
                    err = st.ReadeByteArray()
                    t.Values = append(t.Values, st.buf)

                case "Number":
                    err = st.ReadeByteArray()
                    t.Values = append(t.Values, st.buf)

                case "Struct":
                    err = st.orders.ReadRow(st.row)
                    t.Values = append(t.Values, st.orders)

                default:
                    return m,errors.New("par NOT IDENTIFICATION TYPE PARAMETERS")
                }
            }
        case "Range":
            //----выполняем запрос
            st.rows, err = postgres.Requests.RequestsList["queryRead"+table.Name+table.TypeParameter].Query(table.Values...)
            if err == nil {
                if st.rows==nil{println("I am nil")}
                fmt.Println(st.orders)
                for st.rows.Next() {
                    err = st.orders.ReadRows(st.rows)
                    if err != nil {
                        return m, err
                    }
                    t.Name = table.Name
                    t.TypeParameter = table.TypeParameter
                    t.Values = append(t.Values, st.orders)
                }
                m.Tables = append(m.Tables, t)
            }
        default:
            return m, errors.New("par NOT IDENTIFICATION TYPE PARAMETER FOR READ")
        }

		if err != nil {
			return m, err
		}
		t.Name = table.Name
		t.TypeParameter = table.TypeParameter
		m.Tables = append(m.Tables, t)
	}
	return m, nil
}
/*
//----Чтение строк из базы данных
func (st *StructTransact) ReadRows() (Message,error) {
	m := Message{}
	t := Table{}
	var err error
	m.Query = st.Message.Query

	for _, table := range st.Message.Tables {

		if err = postgres.Requests.CheckRequest("queryRead" + table.Name + table.TypeParameter); err != nil {
			return m, err
		}

		st.rows, err = postgres.Requests.RequestsList["queryRead"+table.Name+table.TypeParameter].Query(table.Values...)
		if err == nil {
			for st.rows.Next() {
				err = st.orders.ReadRows(st.rows)
				if err != nil {
					return m, err
				}
				t.Name = table.Name
				t.TypeParameter = table.TypeParameter
				t.Values = append(t.Values, st.orders)
			}
			m.Tables = append(m.Tables, t)
		}
	}
	return m, nil
}*/

func (st *StructTransact) Delete() (error) {

    GuardClientTrans.Lock()
    defer GuardClientTrans.Unlock()


    //Создаем транзацию
    tx, err := postgres.DB.Begin()
    if err != nil {
        println(err.Error())
        return err
    }
    //Откатываем транзакцию
    defer tx.Rollback()

    for _, table := range st.Message.Tables {
        if err = postgres.Requests.CheckRequest("execDelete" + table.Name + table.TypeParameter); err != nil {
            return errors.New("DELETE: "+table.Name + ", parameters: '" + table.TypeParameter +"' error: "+err.Error())
        }
        _, err = tx.Stmt(postgres.Requests.RequestsList["execDelete"+table.Name+table.TypeParameter]).Exec(table.Values...)
        if err != nil {
            return errors.New("DELETE: "+table.Name + ", parameters: '" + table.TypeParameter +"' error: "+err.Error())
        }

    }

    //----Пименяем изменения
    err = tx.Commit()
    if err != nil {
        return err
    }

    return nil
}

//----------------------------------------------------------------------------------------------------------------------

func (st *StructTransact) messageToWebSocTrans(message *Message, buf_id interface{}) {
    cl := ClientList
    var err error
    var msg []byte
    //----Рассылка операторам
    for _, conn := range cl {
        if conn.HashRole == conf.Config.HashOperator{
            msg, err = json.Marshal(message)
            if err ==nil {
                conn.Send <- msg
            }
        }
    }

    //----Рассылка точкам если получится
    if len(message.Tables)>0 && buf_id!=nil{
        var row *sql.Row
        err = st.init_order(message.Tables[0].Name)
        //----Ищем организацию
        switch message.Tables[0].Name{
        case "Order":
            //----Запрашиваем у базы хеш организации
            row, err = postgres.Requests.QueryRow("OrderValueStringOrgHash", buf_id)
        default:
            //----Проверка существоания структур
            if len(message.Tables[0].Values)>0{
                //----Маршалим структуру
                st.buf, err = json.Marshal(message.Tables[0].Values[0])
                if err == nil {
                    //----Передаем json в структуру
                    var o Orders
                    err = json.Unmarshal(st.buf, &o)
                    if err==nil{
                        //----Запрашиваем у базы хеш организации
                        row, err = postgres.Requests.QueryRow("OrderValueStringOrgHash", o.GetOrderID())
                    }
                }
            }else{
                err = errors.New("Need more values for table: '"+message.Tables[0].Name + "'")
            }
        }
        if err==nil{
            //----Получаем из базы хеш организации
            err = row.Scan(&buf_id)
            if err==nil{
                for _, conn := range cl {
                    if conn.HashPoint == buf_id || conn.HashRole == conf.Config.HashOperator{
                        msg, err = json.Marshal(message)
                        if err ==nil {
                            conn.Send <- msg
                        }
                    }
                }
                message.Error = Error{Code:2,Type:"Update",
                    Description:"Данное сообщение не является ошибкой, несет информативный характер для обновлений по веб сокетам"}

            }
        }
        if err!=nil {
            log.Println("messageToWebSocTrans: ",err)
        }
    }else {
        err = errors.New("Need more tables for messageToWebSocTrans")
    }
}