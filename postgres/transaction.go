package postgres

//import (
//    "errors"
//    "project/orders/structures"
//    "database/sql"
//    "sync"
//)
//
////import "project/orders/structures"
//type Structures struct {
//    orders Order
//    rlock        *sync.RWMutex
//}
//
//type Order interface {
//    Insert(qm *structures.QueryMessage) (int64, error)
//    ReadRow(row *sql.Row) error
//    ReadRows(rows *sql.Rows) error
//}
//
//func (st *Structures) Orders (tables map[string][]interface{})error{
//    st.rlock.RLock()
//    defer st.rlock.RUnlock()
//
//    //Создаем транзацию
//    tx, err := DB.Begin()
//    if err != nil {
//        return err
//    }
//    //Откатываем транзакцию
//    defer tx.Rollback()
//
//    //for name, mapstruct := range tables{
//    for name, _ := range tables{
//
//        switch name {
//        case "Order":
//            st.orders = &structures.Order{}
//            break
//
//        case "OrderCustomer":
//            st.orders = &structures.OrderCustomer{}
//            break
//
//        case "OrderList":
//            st.orders = &structures.OrderList{}
//            break
//
//        case "OrderPersonal":
//            st.orders = &structures.OrderPersonal{}
//            break
//
//        case "OrderPayments":
//            st.orders = &structures.OrderPayments{}
//            break
//
//        case "OrderStatus":
//            st.orders = &structures.OrderStatus{}
//            break
//
//        case "Cashbox":
//            st.orders = &structures.Cashbox{}
//            break
//
//        case "ChangeEmployee":
//            st.orders = &structures.ChangeEmployee{}
//            break
//
//        case "Status":
//            st.orders = &structures.Status{}
//            break
//
//        case "TypePayment":
//            st.orders = &structures.TypePayment{}
//            break
//
//        case "TimersCook":
//            st.orders = &structures.TimersCook{}
//            break
//
//        case "ProductOrder":
//            return nil
//        default:
//            return errors.New("ERROR NOT IDENTIFICATION TYPE TABLE")
//        }
//    }
//    return nil
//}
