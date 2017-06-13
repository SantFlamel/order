package services

import (
    "project/order/structures"
    "encoding/json"
)

func GetAreas()[]structures.Message{
    var marr []structures.Message

    m := structures.Message{Query: "Services"}
    var t []interface{}
    var inter interface{}


    err := json.Unmarshal([]byte("{\"City\":\"Курган\",\"Street\":\"Пушкина\",\"House\":\"49\"}"),&inter)
    if err!=nil{
        println("GetAreas", err.Error())
        return marr
    }

    t = append(t,inter)
    m.Tables = append(m.Tables, structures.Table{Name:"GetAreas",Values:t})
    marr = append(marr,m)

    return marr
}

func ProductOrder()[]structures.Message{
    var marr []structures.Message

    m := structures.Message{Query: "Services"}
    var t []interface{}
    var inter interface{}


    err := json.Unmarshal([]byte("{\"Table\":\"ProductOrder\",\"Query\":\"Read\"}"),&inter)
    if err!=nil{
        println("ProductOrder", err.Error())
        return marr
    }

    t = append(t,inter)
    m.Tables = append(m.Tables, structures.Table{Name:"ProductOrder",Values:t})
    marr = append(marr,m)

    return marr
}