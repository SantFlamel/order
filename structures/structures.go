package structures

import (
	"github.com/lib/pq"
	"project/order/postgres"
	"time"
)

var DBTypePayment map[int64]string
var DBStatus map[int64]string

type Structures struct {
	st     *postgres.Stream
	QM     *QueryMessage
	Orders Orders
	Buf    []byte
	Reads  Read
}

//----СООБЩЕНИЯ ПО НОВОМУ ----
type Message struct {
	Tables []Table
	Query  string
	Error  interface{}
    ID_msg string
}
type Table struct {
	Name          string
	TypeParameter string
	Values        []interface{}
	Limit         int
	Offset        int
}

type Error struct {
	Code        int
	Type        string
	Description string
}

//-------------------------

type QueryMessage struct {
	Table         string
	Query         string
	TypeParameter string
	Values        []interface{}
	Limit         int64
	Offset        int64

	ID_msg string
}

//type Structure interface {
//	Read(st *interface{}) error
//	ReadRow(row *sql.Row) error
//	ReadRows(rows *sql.Rows) error
//}

type All struct{}

type Read struct{}

type Order struct {
	ID                int64
	SideOrder         int64
	TimeDelivery      time.Time
	DatePreOrderCook  time.Time
	CountPerson       int64
	Division          string
	NameStorage       string
	OrgHash           string
	Note              string
	DiscountName      string
	DiscountPercent   int64
	Bonus             int64
	Type              string
	Price             float64
	PriceWithDiscount float64
	PriceCurrency     string
	TypePayments      int64
	Order_time        time.Time
	Paid_off          bool
}

type OrderCustomer struct {
	Order_id      int64
	NameCustomer  string
	Phone         string
	Note          string
	City          string
	Street        string
	House         int64
	Building      string
	Floor         int64
	Apartment     int64
	Entrance      int64 //подъезд
	DoorphoneCode string
}

type OrderList struct {
	Order_id        int64
	ID_item         int64
	ID_parent_item  int64
	Price_id        int64
	PriceName       string
	Type_id         int64
	TypeName        string
	Parent_id       int64
	ParentName      string
	Image           string
	Units           string
	Value           float64
	Set             bool
	Finished        bool
	DiscountName    string
	DiscountPercent int64
	Price           float64
	CookingTracker  int64
	TimeCook        int64
	TimeFry         int64
	Composition     string
	Additionally    string
	Packaging       string
}

type OrderPersonal struct {
	Order_id      int64
	Order_id_item int64
	UserHash      string
	FirstName     string
	SecondName    string
	SurName       string
	RoleHash      string
	RoleName      string
}

type OrderPayments struct {
	Order_id     int64
	UserHash     string
	TypePayments int64
	Price        float64
	Time         time.Time
}

type OrderStatus struct {
	ID            int64
	Order_id      int64
	Order_id_item int64
	Cause         string
	Status_id     int64
	UserHash      string
	Time          time.Time
}

type TimersCook struct {
	Order_id      int64
	Order_id_item int64
	Time_begin    time.Time
	Time_end      time.Time
	Count         int64
	Finished      bool
}

type Status struct {
	ID   int64
	Name string
}

type TypePayment struct {
	ID   int64
	Name string
}

type Cashbox struct {
	ID                 int64     //- идентификатор
	Order_id           int64     //- идентификатор заказа
	Change_employee_id int64     //- идентификатор смены
	First_sure_name    string    //- Фамилия Имя юзера
	UserHash           string    //- Хеш юзера
	RoleName           string    //- Имя роли
	OrgHash            string    //- хеш организации
	TypePayments       int64     //- тип оплаты
	TypeOperation      bool      //- тип операции
	Cause              string    //- описание
	Deposit            float64   //- сумма внесения
	ShortChange        float64   //- сдача
	TimeOperation      time.Time //- время операции
}

//СМЕНЫ пользователей
type ChangeEmployee struct {
	ID              int64
	UserHash        string
	OrgHash         string
	Sum_in_cashbox  float64
	NonCash_end_day float64
	Cash_end_day    float64
	Close           bool
	Date_begin      time.Time
	Date_end        time.Time
}

//для курьеров
type CurierInfo struct {
	ss             Session
	Distance       float64
	Free           bool
	MaxOrder       int
	LastActiveTime time.Time
}

//От других микросервисов
type Session struct {
	SessionHash      string
	UserHash         string
	SurName          string
	FirstName        string
	SecondName       string
	VPNNumber        string
	VPNPassword      string
	Language         string
	RoleHash         string
	RoleName         string
	OrganizationHash string
	OrganizationName string
	Rights           string
	SkladName        pq.StringArray
	SessionData      string
	Begin            time.Time
	End              time.Time
}

//Печать чеков
type StructPrintable struct {
	Header    string
	InfoOrg   string
	InfoCheck string
	Body      []string
	//ItemOrders        []string
	//Price             string
	//Discount          []string
	//PriceWithDiscount string
	//PriceCurrency     string
	//TypePayment       string
	//TypeOperation     string
	//ShortChange       string
	Thanks  string
	Footer  string
	OrgHash string
}

/*
    ID              int64     //- идентификатор
	Order_id        int64     //- идентификатор заказа
	First_sure_name string    //- Фамилия Имя юзера
	UserHash        string    //- Хеш юзера
	RoleName        string    //- Имя роли
	OrgHash         string    //- хеш организации
	TypePayments    int64     //- тип оплаты
	TypeOperation   string    //- тип операции
	Cause           string    //- описание
	Deposit         float64   //- сумма внесения
	ShortChange     float64   //- сдача
	TimeOperation   time.Time //- время операции
*/
