package structures

import "database/sql"

type Orders interface {
    Insert(table,type_parameter string,tx *sql.Tx) (interface{}, error)
    SetOrderID(id int64)
    GetOrderID()int64
    PostTransaction()error
    ReadRow(row *sql.Row) error
    ReadRows(rows *sql.Rows) error
}