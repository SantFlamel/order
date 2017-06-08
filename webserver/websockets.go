package webserver

import (
    "github.com/gorilla/websocket"
    "project/order/structures"
    "net/http"
    "strings"
    "fmt"
    "log"
    "io"
    "time"
)

type AuthWEB struct {
    HashAuth string
}



func WSHandler(w http.ResponseWriter, r *http.Request) {
    //
    conn, err := websocket.Upgrade(w, r, nil, 1024, 1024)
    if _, ok := err.(websocket.HandshakeError); ok {
        http.Error(w, "Not a websocket handshake", 400)
        return
    } else if err != nil {
        return
    }

    //uuid := uuid.New()
    client := conn.RemoteAddr()
    socketClient := structures.ClientConn{IP: client,Send:make(chan []byte, 1024)}
    socketClient.SetConn(conn)
    go socketClient.WritePump()
    //var msg []byte

    //var authS string
    auth := AuthWEB{}
    //mType, msg, err = conn.ReadMessage()
    err = conn.ReadJSON(&auth)
    if err != nil {
        structures.RemoveClient(socketClient)
        if !(err == io.EOF || err == io.ErrUnexpectedEOF) {
            //log.Println(err)
            log.Println(err)
        }
        conn.Close()
        return
    }

    if strings.TrimSpace(auth.HashAuth) == "" {
        conn.WriteMessage(1,[]byte("00:Auth{EMPTY HASH AUTH"))
        conn.Close()
        return
    }

    println("HashAuth: ",auth.HashAuth, conn.RemoteAddr().String())
    socketClient.HashAuth = auth.HashAuth
    err = structures.AddClient(socketClient)
    if err != nil {
        conn.WriteMessage(1, []byte("00:Auth{NO CHECKED "+auth.HashAuth+" ERROR:'"+err.Error()+"' "+time.Now().String()))
        println("00:Auth{NO CHECKED "+auth.HashAuth+" ERROR:'"+err.Error()+"' "+time.Now().String())
        println("-------DELETE_SOC_CONN : ",socketClient.HashAuth)
        structures.RemoveClient(socketClient)
        conn.Close()
    } else {
        socketClient.Send<-[]byte("01:SESSION UP")
    }
    defer println("-------DELETE_SOC_CONN : ",socketClient.HashAuth)
    defer structures.RemoveClient(socketClient)
    defer conn.Close()
    for {
        _, msg, err := conn.ReadMessage()
        if err != nil {
            println("==============================================================")
            println("ВЕБСОКЕТЫ УПАЛИ",conn.RemoteAddr().String())
            println("Ошибка:",err.Error())
            break
        }
        println("GET MESSAGE:",string(msg))
        if strings.TrimSpace(string(msg))=="" {
            continue
        }

        if string(msg) =="EndConn"{
            conn.Close()
        }
        //send(msg,Client)

        if strings.ToUpper(strings.TrimSpace(string(msg)))=="PING" {
            //if string(msg)=="PING" {
            println("-------------- PING --------------")
            conn.WriteMessage(1,[]byte("PONG"))
            break
        }
        st := structure{Client: &socketClient}
        err = st.SelectTables(msg)
        if err != nil {
            //conn.WriteMessage(1,[]byte("00:" + st.qm.ID_msg + "{" + st.qm.Table + " ERROR " + st.qm.Query + ", TYPE PARAMETERS \"" + st.qm.TypeParameter + "\" VALUES: "+fmt.Sprintf("%v",st.qm.Values)+": " + err.Error()))
            st.send([]byte(st.qm.ID_msg + "{" + st.qm.Table + " ERROR " + st.qm.Query + ", TYPE PARAMETERS \"" + st.qm.TypeParameter + "\" VALUES: "+fmt.Sprintf("%v",st.qm.Values)+": "),err)
            if !strings.Contains(err.Error(),"sql: no rows in result set") {
                log.Println("00:"+st.qm.ID_msg+"{"+st.qm.Table+" ERROR "+st.qm.Query+", TYPE PARAMETERS \""+st.qm.TypeParameter+"\" VALUES: "+fmt.Sprintf("%v", st.qm.Values)+":", err.Error())
            }
        }
    }
}

