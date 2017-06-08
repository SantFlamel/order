package postgres

import (
	"database/sql"
	"errors"
	"log"
)



type Stream struct {
	Rows *sql.Rows
	Row  *sql.Row
}

func (dbr *DBRequests) CheckRequest(request string) error {
    _, ok := dbr.RequestsList[request]
    if !ok {
        return errors.New("sql: Mismatch request!")
    }
    return nil
}
func (dbr *DBRequests) Insert(tx *sql.Tx, table, type_parameter string, values ...interface{}) error {
    var err error

    if err = dbr.CheckRequest("execInsert" + table + type_parameter);err!=nil{
        return err
    }
	//tx, err := DB.Begin()
	//if err != nil {
	//	return err
	//}
	//defer tx.Rollback()

	_, err = tx.Stmt(dbr.RequestsList["execInsert" + table + type_parameter]).Exec(values...)
	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return err
}

func (dbr *DBRequests) InsertGetID(tx *sql.Tx, table, type_parameter string, values ...interface{}) (interface{}, error) {
    var err error
    if err = dbr.CheckRequest("execInsert" + table + type_parameter);err!=nil{
        return nil,err
    }
    var i interface{}
    err = tx.Stmt(Requests.RequestsList["execInsert" + table + type_parameter]).QueryRow(values...).Scan(&i)
	if err!=nil {
		return i, errors.New("sql: ERROR INSERT TO TABLE: '" + table + "', TYPE PARAMETERS: '" + type_parameter + "' ERROR: '" + err.Error() + "'")
	}
	return i,nil
}

func (dbr *DBRequests) InsertGetIDWithTransaction(table, type_parameter string, values ...interface{}) (interface{}, error) {
    dbr.rlock.RLock()
    defer dbr.rlock.RUnlock()
    var err error
    if err = dbr.CheckRequest("execInsert" + table + type_parameter);err!=nil{
        return nil,err
    }

    tx, err := DB.Begin()
    if err != nil {
        return nil, err
    }

	//----Возвращаем все как было
	defer tx.Rollback()

    var i interface{}
    err = tx.Stmt(Requests.RequestsList["execInsert" + table + type_parameter]).QueryRow(values...).Scan(&i)
	if err!=nil {
		return i, errors.New("sql: ERROR INSERT TO TABLE: '" + table + "', TYPE PARAMETERS: '" + type_parameter + "' ERROR: '" + err.Error() + "'")
	}

	//return i,nil
    err = tx.Commit()
    return i,err
}

//----------------------------------------------------------------------------------------------------------------------
//----UPDATE_DATA
func (dbr *DBRequests) Update(table, type_parameter string, values ...interface{}) error {
    var err error
    if err = dbr.CheckRequest("execUpdate" + table + type_parameter);err!=nil{
        return err
    }

	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Stmt(dbr.RequestsList["execUpdate" + table + type_parameter]).Exec(values...)
	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----READ_ROW
func (s *Stream) ReadRow(table, type_parameter string, values ...interface{}) error {
    var err error
    if err = Requests.CheckRequest("queryRead" + table + type_parameter);err!=nil{
        return err
    }

	s.Row = Requests.RequestsList["queryRead" + table + type_parameter].QueryRow(values...)

	return nil
}

//----------------------------------------------------------------------------------------------------------------------
//----READ_ROWS
func (s *Stream) ReadRows(table, type_parameter string, values ...interface{}) error {

    var err error
    if err = Requests.CheckRequest("queryRead" + table + type_parameter);err!=nil{
        return err
    }

	s.Rows, err = Requests.RequestsList["queryRead" + table + type_parameter].Query(values...)

	return err
}

func (s *Stream) NextOrder() bool {
	for s.Rows.Next() {
		println("I am scan Rows.Next")
		var err error
		err = s.Rows.Scan()
		if err != nil {
			log.Println("00:SCAN ROWS -", err.Error())
			continue
		}
		return true
	}
	return false
}

//----------------------------------------------------------------------------------------------------------------------
//----DELETE
func (dbr *DBRequests) Delete(table, type_parameter string, values ...interface{}) error {
	Guard.RLock(table)
	defer Guard.Unlock(table)

	var err error

    if err = Requests.CheckRequest("execDelete" + table + type_parameter);err!=nil{
        return err
    }
	var tx *sql.Tx
	tx, err = DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Stmt(dbr.RequestsList["execDelete" + table + type_parameter]).Exec(values...)

	err = tx.Commit()
	if err != nil {
		return err
	}

	return err
}

