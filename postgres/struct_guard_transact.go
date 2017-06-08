package postgres

import "sync"

//======================================================================================================================
//======================================================================================================================

var Guard Guards

type Guards struct {
    Order         *sync.RWMutex
    OrderCustomer *sync.RWMutex
    OrderList     *sync.RWMutex
    OrderPersonal *sync.RWMutex
    OrderPayments *sync.RWMutex
    OrderStatus   *sync.RWMutex
    TimersCook    *sync.RWMutex
    Status        *sync.RWMutex
    TypePayment   *sync.RWMutex
    Cashbox       *sync.RWMutex
    DefaultGuard  *sync.RWMutex
}

func (g *Guards) Init() {
    g.Order = &sync.RWMutex{}
    g.OrderCustomer = &sync.RWMutex{}
    g.OrderList = &sync.RWMutex{}
    g.OrderPersonal = &sync.RWMutex{}
    g.OrderPayments = &sync.RWMutex{}
    g.OrderStatus = &sync.RWMutex{}
    g.TimersCook = &sync.RWMutex{}
    g.Status = &sync.RWMutex{}
    g.TypePayment = &sync.RWMutex{}
    g.Cashbox = &sync.RWMutex{}
    g.DefaultGuard = &sync.RWMutex{}
}

func (g *Guards) Lock(table string) {
    switch table {
    case "Order":
        g.Order.Lock()
        break
    case "OrderCustomer":
        g.OrderCustomer.Lock()
        break
    case "OrderList":
        g.OrderList.Lock()
        break
    case "OrderPersonal":
        g.OrderPersonal.Lock()
        break
    case "OrderPayments":
        g.OrderPayments.Lock()
        break
    case "OrderStatus":
        g.OrderStatus.Lock()
        break
    case "TimersCook":
        g.TimersCook.Lock()
        break
    case "Status":
        g.Status.Lock()
        break
    case "TypePayment":
        g.TypePayment.Lock()
        break
    case "Cashbox":
        g.Cashbox.Lock()
        break
    default:
        g.DefaultGuard.Lock()
    }
}

func (g *Guards) Unlock(table string) {
    switch table {
    case "Order":
        g.Order.Unlock()
        break
    case "OrderCustomer":
        g.OrderCustomer.Unlock()
        break
    case "OrderList":
        g.OrderList.Unlock()
        break
    case "OrderPersonal":
        g.OrderPersonal.Unlock()
        break
    case "OrderPayments":
        g.OrderPayments.Unlock()
        break
    case "OrderStatus":
        g.OrderStatus.Unlock()
        break
    case "TimersCook":
        g.TimersCook.Unlock()
        break
    case "Status":
        g.Status.Unlock()
        break
    case "TypePayment":
        g.TypePayment.Unlock()
        break
    case "Cashbox":
        g.Cashbox.Unlock()
        break
    default:
        g.DefaultGuard.Unlock()
    }
}

func (g *Guards) RLock(table string) {
    switch table {
    case "Order":
        g.Order.RLock()
        break
    case "OrderCustomer":
        g.OrderCustomer.RLock()
        break
    case "OrderList":
        g.OrderList.RLock()
        break
    case "OrderPersonal":
        g.OrderPersonal.RLock()
        break
    case "OrderPayments":
        g.OrderPayments.RLock()
        break
    case "OrderStatus":
        g.OrderStatus.RLock()
        break
    case "TimersCook":
        g.TimersCook.RLock()
        break
    case "Status":
        g.Status.RLock()
        break
    case "TypePayment":
        g.TypePayment.RLock()
        break
    case "Cashbox":
        g.Cashbox.RLock()
        break
    default:
        g.DefaultGuard.RLock()
    }
}

func (g *Guards) RUnlock(table string) {
    switch table {
    case "Order":
        g.Order.RUnlock()
        break
    case "OrderCustomer":
        g.OrderCustomer.RUnlock()
        break
    case "OrderList":
        g.OrderList.RUnlock()
        break
    case "OrderPersonal":
        g.OrderPersonal.RUnlock()
        break
    case "OrderPayments":
        g.OrderPayments.RUnlock()
        break
    case "OrderStatus":
        g.OrderStatus.RUnlock()
        break
    case "TimersCook":
        g.TimersCook.RUnlock()
        break
    case "Status":
        g.Status.RUnlock()
        break
    case "TypePayment":
        g.TypePayment.RUnlock()
        break
    case "Cashbox":
        g.Cashbox.RUnlock()
        break
    default:
        g.DefaultGuard.RUnlock()
    }
}