package tables

import "project/order/structures"

func OrderList ()[]interface{}{
    var inter []interface{}

    inter = append(inter,structures.OrderList{PriceName: "Варенники", Price: float64(1), CookingTracker: 2})
    inter = append(inter,structures.OrderList{PriceName: "Колбаска", CookingTracker: 2})
    inter = append(inter,structures.OrderList{PriceName: "Гудрон", CookingTracker: 2})
    inter = append(inter,structures.OrderList{PriceName: "Мяу", CookingTracker: 2})

    return inter
}
