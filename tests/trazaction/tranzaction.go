package trazaction

import (
    "time"
    "fmt"
    "log"
    "database/sql"
    "errors"
    "sync"
)

type Type struct {
    Type_id int64
    Parent_id int64
    Name string
    Level int64 //уровень - Type
    End bool //лиcт иерархии - Type
    Active bool
    CreationTime time.Time

    CreationTimeStr string

    // Levelf bool
    // Endf bool
}
var Mutex sync.RWMutex

func (newType *Type) Create() error {

    Mutex.RLock()

    if comments {
        fmt.Println("Postgre: Create Type")
        log.Println("Postgre: Create Type")
    }

    var oldType Type

    newType.End = true
    newType.CreationTime = time.Now()


    //Создаем транзацию
    tx, err := postgresql.DB.Begin()
    if err != nil {
        Mutex.RUnlock("Type")
        return err
    }

    //Откатываем транзакцию
    defer tx.Rollback()

    //Если есть предок, то от него уровень + 1 и у предка сделать End=false
    if (newType.Parent_id) > 0 {
        //Прочитать предка и получить его уровень
        err = oldType.Read(newType.Parent_id)
        if err != nil {
            Mutex.RUnlock("Type")
            return err
        }
        //Обновить предку End=false, если было true
        if oldType.End {
            oldType.End = false

            ExUe, err := postgresql.DB.Prepare("UPDATE \"Type\" SET \"End\"=$2,\"Changed\"=true WHERE \"Type_id\"=$1")
            if err != nil {
                Mutex.RUnlock("Type")
                return err
            }
            _, err = tx.Stmt(ExUe).Exec(oldType.Type_id, oldType.End)
            if err != nil {
                Mutex.RUnlock("Type")
                return err
            }
        }
        newType.Level = oldType.Level + 1 //Уровень предка + 1-новый уровень для создаваемого типа
    }

    Ex, err := postgresql.DB.Prepare("INSERT INTO \"Type\" (\"Parent_id\",\"Name\",\"Level\",\"End\",\"Active\",\"CreationTime\",\"Changed\") VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING \"Type_id\"")
    if err != nil {
        Mutex.RUnlock("Type")
        return err
    }
    err = tx.Stmt(Ex).QueryRow(newType.Parent_id, newType.Name, newType.Level, newType.End, newType.Active, newType.CreationTime).Scan(&newType.Type_id)
    if err != nil {
        Mutex.RUnlock("Type")
        return err
    }

    Mutex.RUnlock("Type")
    //Применяем транзакцию
    err = tx.Commit()

    return err
}




//
////Чтение одного //Type+(тип), держи ошибку
//func (PT *Type) Read(Type_id interface{}) error {
//
//    Mutex.RLock("Type")
//    defer Mutex.RUnlock("Type")
//
//    if comments {
//        fmt.Println("Postgre: Read Type")
//        log.Println("Postgre: Read Type")
//    }
//
//    var row *sql.Row
//    var err error
//
//    row, err = postgresql.Requests.QueryRow("ReadTypeByHash", Type_id)
//    if err != nil {
//        return err
//    }
//
//    err = row.Scan(
//        &PT.Type_id,
//        &PT.Parent_id,
//        &PT.Name,
//        &PT.Level,
//        &PT.End,
//        &PT.Active,
//        &PT.CreationTime)
//
//    PT.CreationTimeStr = FormatDate(PT.CreationTime)
//
//    return err
//}
//
////Обновление //Type, держи ошибку
//func (newType *Type) Update() error {
//
//    if comments {
//        fmt.Println("Postgre: Update Type")
//        log.Println("Postgre: Update Type")
//    }
//
//    var err error
//    var oldType Type
//
//    //Читаем старую запись
//    err = oldType.Read(newType.Type_id)
//    Mutex.Lock("Type")
//
//    if err != nil {
//        return err
//    }
//
//    if len(oldType.CreationTime.String()) == 0 {
//        Mutex.Unlock("Type")
//        return errors.New("Error in updating:Not search record for updating")
//    }
//    if len(newType.Name) > 0 {
//        oldType.Name = newType.Name
//    }
//    oldType.Active = newType.Active
//
//    //Уровень нужно прочитать у нового предка+1
//    // if newType.Levelf {
//    //  oldType.Level = newType.Level
//    // }
//    // if newType.Endf {
//    //  oldType.End = newType.End
//    // }
//
//    var row *sql.Row
//    var rows *sql.Rows
//    var newParentType Type
//    var oldParentType Type
//    var childrenType Type
//    var step int64
//
//
//    //Открываем транзакцию
//    tx, err := postgresql.DB.Begin()
//    if err != nil {
//        Mutex.Unlock("Type")
//        return err
//    }
//    defer tx.Rollback()
//
//    ExUe, err := postgresql.DB.Prepare("UPDATE \"Type\" SET \"End\"=$2,\"Changed\"=true
//    WHERE \"Type_id\"=$1")
//    if err != nil {
//        Mutex.Unlock("Type")
//        return err
//    }
//    ExUl, err := postgresql.DB.Prepare("UPDATE \"Type\" SET \"Level\"=$2,\"Changed\"=true WHERE \"Type_id\"=$1")
//    if err != nil {
//        Mutex.Unlock("Type")
//        return err
//    }
//
//    //Работа с предками и потомками, если предок обновился
//    if newType.Parent_id != oldType.Parent_id {
//        //oldType.Parent_id - старый предок var newParentType Type
//        //newType.Parent_id - новый предок  var oldParentType Type
//
//        //Читаем нового предка.Если он был листом, то меняем ему флаг
//        ////////////////////////////////////////////////////////////////
//        if newType.Parent_id > 0 {
//
//            Mutex.Unlock("Type")
//            err = newParentType.Read(newType.Parent_id)
//            if err != nil {
//                return err
//            }
//            Mutex.Lock("Type")
//
//            if newParentType.End {
//                //newParentType.Endf = true
//                newParentType.End = false
//                //Mutex.Unlock("Type")
//                //err = newParentType.Update()
//                _, err = tx.Stmt(ExUe).Exec(newParentType.Type_id, newParentType.End)
//                if err != nil {
//                    return err
//                }
//                //Mutex.Lock("Type")
//            }
//
//        }
//        ////////////////////////////////////////////////////////////////
//
//        // Работа со старым предком, если он существует
//        ////////////////////////////////////////////////////////////////
//        if oldType.Parent_id > 0 {
//            var i int64
//            // Чтение предка
//            Mutex.Unlock("Type")
//            err = oldParentType.Read(oldType.Parent_id)
//            Mutex.Lock("Type")
//            //Считаем количество потомков у предка
//            row, err = postgresql.Requests.QueryRow("CountReadTypeByTypeParent", oldType.Parent_id)
//            if err != nil {
//                Mutex.Unlock("Type")
//                return err
//            }
//            row.Scan(&i)
//            // Если у предка больше нет потомков, то делаем его листом
//            if i == 1 {
//                //oldParentType.Endf = true
//                oldParentType.End = true
//                //Mutex.Unlock("Type")
//                //err = oldParentType.Update()
//                _, err = tx.Stmt(ExUe).Exec(oldParentType.Type_id, oldParentType.End)
//                if err != nil {
//                    Mutex.Unlock("Type")
//                    return err
//                }
//                //Mutex.Lock("Type")
//                //if err != nil {
//                // return err
//                //}
//            }
//        }
//        ////////////////////////////////////////////////////////////////
//
//        if newType.Parent_id == 0 {
//            fmt.Println("Ставим на нолевой уровень.", "Старый уровень:", oldType.Level, -oldType.Level)
//            step = oldType.Level * (-1)
//            fmt.Println("Шаг:", step)
//            oldType.Level = 0
//        } else {
//            if newParentType.Level >= oldType.Level {
//                fmt.Println("Новый предок выше уровнем")
//                step = 2
//                fmt.Println("Шаг:", step)
//                oldType.Level = newParentType.Level + 1
//            } else if newParentType.Level < oldType.Level {
//                fmt.Println("Новый предок ниже уровнем")
//                step = (newParentType.Level + 1) - oldType.Level
//                fmt.Println("Шаг:", step)
//                oldType.Level = newParentType.Level + 1
//            }
//        }
//
//        //Работа с потомками, если они существуют
//        ////////////////////////////////////////////////////////////////
//        if !oldType.End {
//            rows, err = OpenStream("Type", "TypeParent", oldType.Type_id)
//            if err != nil {
//                Mutex.Unlock("Type")
//                return err
//            }
//            for rows.Next() {
//                err = rows.Scan(
//                    &childrenType.Type_id,
//                    &childrenType.Parent_id,
//                    &childrenType.Name,
//                    &childrenType.Level,
//                    &childrenType.End,
//                    &childrenType.Active,
//                    &childrenType.CreationTime)
//
//                //Изменение уровня потомков
//                fmt.Println("потомок", childrenType.Name, "уровень:", childrenType.Level, "новый уровень:", childrenType.Level+step)
//                childrenType.Level = childrenType.Level + step
//                //childrenType.Levelf = true
//                //Обновление потомков
//                //Mutex.Unlock("Type")
//                //err = childrenType.Update()
//                _, err = tx.Stmt(ExUl).Exec(childrenType.Type_id, childrenType.Level)
//                if err != nil {
//                    Mutex.Unlock("Type")
//                    return err
//                }
//            }
//            //Mutex.Lock("Type")
//        }
//        ////////////////////////////////////////////////////////////////
//        oldType.Parent_id = newType.Parent_id
//    }
//
//    // err = postgresql.Requests.ExecTransact("UpdateTypeByType_id",
//    //  oldType.Type_id,
//    //  oldType.Parent_id,
//    //  oldType.Name,
//    //  oldType.Level,
//    //  oldType.End,
//    //  oldType.Active)
//
//    Ex, err := postgresql.DB.Prepare("UPDATE \"Type\" SET \"Parent_id\"=$2,\"Name\"=$3,\"Level\"=$4,\"End\"=$5,\"Active\"=$6,\"Changed\"=true WHERE \"Type_id\"=$1")
//    if err != nil {
//        Mutex.Unlock("Type")
//        return err
//    }
//    _, err = tx.Stmt(Ex).Exec(oldType.Type_id, oldType.Parent_id, oldType.Name, oldType.Level, oldType.End, oldType.Active)
//    if err != nil {
//        Mutex.Unlock("Type")
//        return err
//    }
//
//    err = tx.Commit()
//
//    Mutex.Unlock("Type")
//    return err
//}
//
////Обработать работу с мьютексами и ошибками
//func (removeType *Type) Remove(Type_id interface{}) error {
//
//    var err error
//    var row *sql.Row
//    var rows *sql.Rows
//
//    tx, err := postgresql.DB.Begin()
//    if err != nil {
//        Mutex.Unlock("Type")
//        return err
//    }
//    defer tx.Rollback()
//
//    //Удаление листа
//    //Удаление корня, у которого нет предка
//    //Удаление корня, у которого есть предок
//
//    //Читаем удаляемый тип
//    err = removeType.Read(Type_id)
//    if err != nil {
//        return err
//    }
//
//    fmt.Println("Удаляемый тип:", removeType)
//
//    Mutex.Lock("Type")
//
//    //Удаляем сам тип
//    //err = postgresql.Requests.ExecTransact("RemoveTypeByHash", Type_id)
//
//    Ex, err := postgresql.DB.Prepare("DELETE FROM \"Type\" WHERE \"Type_id\" = $1")
//    if err != nil {
//        Mutex.Unlock("Type")
//        return err
//    }
//    _, err = tx.Stmt(Ex).Exec(Type_id)
//    if err != nil {
//        Mutex.Unlock("Type")
//        return err
//    }
//
//    //1.Работа с потомками, если они существуют(т.е. удаляемый тип-корень)
//    if !removeType.End {
//        //Читаем всех потомков
//        fmt.Println("Читаем всех потомков")
//        rows, err = OpenStream("Type", "TypeParent", Type_id)
//        childrenType := Type{}
//        for rows.Next() {
//            err = rows.Scan(
//                &childrenType.Type_id,
//                &childrenType.Parent_id,
//                &childrenType.Name,
//                &childrenType.Level,
//                &childrenType.End,
//                &childrenType.Active,
//                &childrenType.CreationTime)
//
//            //присвоить прямым наследникам в предка ID предка их удаляемого предка.
//            if childrenType.Parent_id == removeType.Type_id {
//                fmt.Println("Присвоить прямым наследникам в предка ID предка их удаляемого предка.Наследник:", childrenType.Type_id, "У него был:", childrenType.Parent_id, "Ставим:", removeType.Parent_id)
//                childrenType.Parent_id = removeType.Parent_id
//            }
//            //Уменьшить уровни у всех потомков на 1
//            fmt.Println("Уменьшить уровни у всех потомков на 1.Наследник:", childrenType.Name, "У него был:", childrenType.Level, "Ставим:", childrenType.Level-1)
//            childrenType.Level = childrenType.Level - 1
//            //Обновление потомков
//            //err = childrenType.Update()
//
//            Ex, err := postgresql.DB.Prepare("UPDATE \"Type\" SET \"Parent_id\"=$2,\"Level\"=$3 WHERE \"Type_id\"=$1")
//            if err != nil {
//                Mutex.Unlock("Type")
//                return err
//            }
//            _, err = tx.Stmt(Ex).Exec(childrenType.Type_id, childrenType.Parent_id, childrenType.Level)
//            if err != nil {
//                Mutex.Unlock("Type")
//                return err
//            }
//        }
//
//    } else if removeType.Parent_id > 0 {
//        //2.Работа с предком, если он существует
//        var i int64
//        parentType := Type{}
//
//        //2.1 Чтение предка
//        Mutex.Unlock("Type")
//        fmt.Println("Чтение предка.")
//        err = parentType.Read(removeType.Parent_id)
//        if err != nil {
//            return err
//        }
//        fmt.Println("Предок:", parentType)
//        Mutex.Lock("Type")
//        //Считаем количество потомков у предка
//        row, err = postgresql.Requests.QueryRow("CountReadTypeByTypeParent", removeType.Parent_id)
//        if err != nil {
//            Mutex.Unlock("Type")
//            return err
//        }
//        row.Scan(&i)
//        fmt.Println("Считаем количество потомков у предка:", i)
//        //2.2 Если у предка больше нет потомков, то делаем его листом
//        if i == 1 {
//            //parentType.Endf = true
//            parentType.End = true
//            //err = parentType.Update()
//            Ex, err := postgresql.DB.Prepare("UPDATE \"Type\" SET \"End\"=$2 WHERE \"Type_id\"=$1")
//            if err !=
//
//                    nil {
//                Mutex.Unlock("Type")
//                return err
//            }
//            _, err = tx.Stmt(Ex).Exec(parentType.Type_id, parentType.End)
//            if err != nil {
//                Mutex.Unlock("Type")
//                return err
//            }
//        }
//    }
//
//    err = tx.Commit()
//
//    Mutex.Unlock("Type")
//    return err
//}