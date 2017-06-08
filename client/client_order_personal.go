package main

import (
	"project/orders/structures"
	"encoding/json"
    "time"
)

func order_personal(id int)error  {
	orPers := structures.OrderPersonal{
		Order_id:      ID,
		Order_id_item: IDitem,
		UserHash:      "aksjdghakjsdghkajs",
		FirstName:     "FirstName",
		SecondName:    "SecondName",
		SurName:       "SurName",
		RoleHash:      "RoleHash",
		RoleName:      "RoleName",
	}
	qm := structures.QueryMessage{Table:"OrderPersonal"}
    var err error
    var qmM []byte

	switch id {
	case 1:
		println("----CREATE")
        var orM []byte
		qm.Query = "Create"
		qmM, err = json.Marshal(qm)
		if err == nil {
            orM, err = json.Marshal(orPers)
            if err == nil {
                _, err = send(string(qmM) + string(orM))
            }
		}
	case 2:
		println("----READ_VALUE")
		qm.Query = "Read"
		qm.TypeParameter = "Value"
		qm.Values = []interface{}{ID,IDitem,orPers.UserHash}
		qmM, err = json.Marshal(qm)
		if err == nil {
            _, err = send(string(qmM))
		}
    case 3:
        println("----READ_RANGE_ROLE")
        qm.Query = "Read"
        qm.TypeParameter = "RangeRole"
        qm.Values = []interface{}{ID,orPers.RoleHash}
        qm.Limit = 10
        qm.Offset = 0
        qmM, err = json.Marshal(qm)
        if err == nil {
            sendReadRange(string(qmM))
        }
    case 4:
        println("----READ_RANGE_ROLE")
        qm.Query = "Read"
        qm.TypeParameter = "RangeOrderID"
        qm.Values = []interface{}{ID}
        qm.Limit = 10
        qm.Offset = 0
        qmM, err := json.Marshal(qm)
        if err == nil {
            sendReadRange(string(qmM))
        }

	}
	return err
}

//--------------------------------------------------------------------------------

func order_payments (id int) error{
    orPay := structures.OrderPayments{
        Order_id:ID,
        Price:123123.23,
        Time:time.Now(),
    }
    qm := structures.QueryMessage{Table:"OrderPayments"}
    var err error
    var qmM []byte


    switch id {
    case 1:
        println("----CREATE")
        var orM []byte
        qm.Query = "Create"
        qmM, err = json.Marshal(qm)
        if err == nil {
            orM, err = json.Marshal(orPay)
            if err==nil{
                _, err = send(string(qmM) + string(orM))
            }
        }
    case 2:
        qm.Query = "Update"
        qm.Values = []interface{}{ID,123.24,time.Now()}
        qmM, err := json.Marshal(qm)
        if err == nil {
            _, err = send(string(qmM))
        }
    case 3:
        qm.Query = "Read"
        qm.TypeParameter="Value"
        qm.Values = []interface{}{ID}
        qmM, err := json.Marshal(qm)
        if err == nil {
            _, err = send(string(qmM))
        }
    case 4:
        qm.Query = "Read"
        qm.TypeParameter="RangeAll"
        qm.Limit=100
        qm.Offset=0
        qmM, err := json.Marshal(qm)
        if err == nil {
            sendReadRange(string(qmM))
        }
    case 5:
        qm.Query = "Read"
        qm.TypeParameter="RangeOrderID"
        qm.Limit=100
        qm.Offset=0
        qm.Values = []interface{}{ID}
        qmM, err := json.Marshal(qm)
        if err == nil {
            sendReadRange(string(qmM))
        }
    }

    return err
}

//--------------------------------------------------------------------------------
func order_status(id int)error{
    orStat := structures.OrderStatus{
        Order_id:ID,
        Order_id_item:IDitem,
        Cause: "Bla bla bla",
        Status_id:1,
        UserHash: "ajsdasgdjhsagdjhsg",
        Time:time.Now(),
    }
    qm := structures.QueryMessage{Table:"OrderPayments"}
    var err error
    var qmM []byte

    switch id {
    case 1:
        println("----CREATE")
        var orM []byte
        qm.Query = "Create"
        qmM, err = json.Marshal(qm)
        if err == nil {
            orM, err = json.Marshal(orStat)
            if err==nil{
                _, err = send(string(qmM) + string(orM))
            }
        }
    case 2:
        qm.Query = "Read"
        qm.TypeParameter="Value"
        qm.Values = []interface{}{ID,orStat.Time}
        qmM, err := json.Marshal(qm)
        if err == nil {
            _, err = send(string(qmM))
        }
    case 3:
        qm.Query = "Read"
        qm.TypeParameter="RangeOrderID"
        qm.Limit=100
        qm.Offset=0
        qm.Values = []interface{}{ID}
        qmM, err := json.Marshal(qm)
        if err == nil {
            sendReadRange(string(qmM))
        }
    }
    return err
}

//--------------------------------------------------------------------------------
func order_customer(id int)error{
    orCust := structures.OrderCustomer{
        Order_id:ID,
        NameCustomer:"NameCustomer",
        Phone:"78234987263",
        Note:"Note",
        City:"City",
        Street:"Street",
        House:12,
        Building:"Building",
        Floor:1,
        Apartment:1,
        Entrance:2,
        DoorphoneCode:"DoorphoneCode",
    }
    qm := structures.QueryMessage{Table:"OrderCustomer"}
    var err error
    var qmM []byte
    switch id {
    case 1:
        println("----CREATE")
        var orM []byte
        qm.Query = "Create"
        qmM, err = json.Marshal(qm)
        if err == nil {
            orM, err = json.Marshal(orCust)
            if err==nil{
                _, err = send(string(qmM) + string(orM))
            }
        }
    case 2:
        println("----UPDATE")
        qm.Query = "Update"
        qm.Values = []interface{}{ID,
            "NewNameCustomer", "New78234987263", "NewNote", "NewCity", "NewSreet", 14,
            "NewBuilding", 2, 3, 5, "NewDoorphoneCode",
        }
        qmM, err = json.Marshal(qm)
        if err == nil {
            _, err = send(string(qmM))
        }
    case 3:
        println("----READ")
        qm.Query = "Read"
        qm.TypeParameter="Value"
        qm.Values = []interface{}{ID}
        qmM, err = json.Marshal(qm)
        if err == nil {
            _, err = send(string(qmM))
        }
    }

    return err
}