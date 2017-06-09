package tables

import "project/order/structures"

func Order()[]interface{}{
    var inter []interface{}
    inter = append(inter,structures.Order{OrgHash:       "TestOrgHash", Note: "bla",TypePayments:1})

    return inter
}