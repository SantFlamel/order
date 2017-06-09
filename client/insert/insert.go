package insert

import "project/order/structures"
import "project/order/client/tables"

func Insert() []structures.Message {
    var marr []structures.Message

    m := structures.Message{Query: "Insert"}
    m.Tables = append(m.Tables, structures.Table{Name:"Orders",TypeParameter:"GetID",Values:tables.Order()})
    m.Tables = append(m.Tables, structures.Table{Name:"OrderList",TypeParameter:"GetID",Values:tables.OrderList()})
    marr = append(marr,m)

    return marr
}
