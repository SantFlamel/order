package webserver

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/gorilla/websocket"
	"io"
	"log"
	"net/http"
	"project/order/structures"
	"strings"
	"time"
)

type AuthWEB struct {
	HashAuth string
}

type WS struct {
	Client     *structures.ClientConn
	qm         structures.QueryMessage
	message    structures.Message
	messOrder  interface{}
	row        *sql.Row
	orders     structures.Orders
	Structures structures.Structures
	ID         int64
}

func (ws *WS) WSHandler(w http.ResponseWriter, r *http.Request) {
	//
	conn, err := websocket.Upgrade(w, r, nil, 1024, 1024)
	if _, ok := err.(websocket.HandshakeError); ok {
		http.Error(w, "Not a websocket handshake", 400)
		return
	} else if err != nil {
		return
	}
	client := conn.RemoteAddr()
	socketClient := structures.ClientConn{IP: client}
	socketClient.SetConn(conn)
	ws.Client = &socketClient
	ws.Client.Send = make(chan structures.Message,500)
	go ws.Client.WritePump()

	auth := AuthWEB{}
	err = conn.ReadJSON(&auth)
	if err != nil {
		structures.RemoveClient(socketClient)
		if !(err == io.EOF || err == io.ErrUnexpectedEOF) {
			log.Println(err)
		}
		conn.Close()
		return
	}

	if strings.TrimSpace(auth.HashAuth) == "" {
        ws.send(structures.Message{Query:"HashAuth"},errors.New("EMPTY HASH AUTH"))
		conn.Close()
		return
	}

	println("HashAuth: ", auth.HashAuth, conn.RemoteAddr().String())
	socketClient.HashAuth = auth.HashAuth
	err = structures.AddClient(socketClient)
	if err != nil {
        ws.send(structures.Message{Query:"HashAuth"},errors.New("NO CHECKED " + auth.HashAuth + " ERROR:'" + err.Error() + "' " + time.Now().String()))
		println("NO CHECKED " + auth.HashAuth + " ERROR:'" + err.Error() + "' " + time.Now().String())
		structures.RemoveClient(socketClient)
		conn.Close()
	} else {
        ws.send(structures.Message{Query:"SESSION UP"},nil)
	}
	defer println("-------DELETE_SOC_CONN : ", socketClient.HashAuth)
	defer structures.RemoveClient(socketClient)
	defer conn.Close()

	for {
		//_, msg, err := conn.ReadMessage()
		//if err != nil {
		//	println("==============================================================")
		//	println("ВЕБСОКЕТЫ УПАЛИ", conn.RemoteAddr().String())
		//	println("Ошибка:", err.Error())
		//	break
		//}
		//println("GET MESSAGE:", string(msg))
		//if strings.TrimSpace(string(msg)) == "" {
		//	continue
		//}
        //
		//if string(msg) == "EndConn" {
		//	conn.Close()
		//}
		////send(msg,Client)
        //
		//if strings.ToUpper(strings.TrimSpace(string(msg))) == "PING" {
		//	//if string(msg)=="PING" {
		//	println("-------------- PING --------------")
		//	conn.WriteMessage(1, []byte("PONG"))
		//	break
		//}

        err = conn.ReadJSON(&ws.message)
        if err!=nil{
            ws.send(structures.Message{Error:structures.Error{Code:1,Type:"JSON",Description:"MESSAGE INCORRECT: "+err.Error()}}, nil)
            continue
        }
        fmt.Println("GET MESSAGE:",fmt.Sprint(ws.message))

		sttr := structures.StructTransact{Message: &ws.message}
        go func() {
            ID_msg := ws.message.ID_msg
            switch sttr.Message.Query {
            case "EndConn":
                conn.Close()
                break
            case "Insert":
                ws.message, err = sttr.Insert()
                fmt.Println(ws.message)
            case "Update":
                err = sttr.Update()
                //c.message.Tables = nil
            case "Select":
                ws.message, err = sttr.Read()
            case "Delete":
                err = sttr.Delete()
                //c.message.Tables = nil
            case "Services":
                ws.message, err = sttr.ServiceManager()
            default:
                err = errors.New("NOT IDENTIFICATION QUERY")
            }
            ws.message.ID_msg = ID_msg
            ws.send(ws.message, err)
        }()

		//st := structure{Client: &socketClient}
		//err = st.SelectTables(msg)
		//if err != nil {
		//    st.send([]byte(st.qm.ID_msg + "{" + st.qm.Table + " ERROR " + st.qm.Query + ", TYPE PARAMETERS \"" + st.qm.TypeParameter + "\" VALUES: "+fmt.Sprintf("%v",st.qm.Values)+": "),err)
		//    if !strings.Contains(err.Error(),"sql: no rows in result set") {
		//        log.Println("00:"+st.qm.ID_msg+"{"+st.qm.Table+" ERROR "+st.qm.Query+", TYPE PARAMETERS \""+st.qm.TypeParameter+"\" VALUES: "+fmt.Sprintf("%v", st.qm.Values)+":", err.Error())
		//    }
		//}
	}
}

//----------------------------------------------------------------------------------------------------------------------
//----Отправка сообщений
func (ws *WS) send(message structures.Message, err error) {
	if err != nil {
        message.Tables = nil

        //switch strings.ToLower(string(err.Error()[:3])){
        switch string(err.Error()[:3]){
        case "par":
            message.Error = structures.Error{Code:1, Type:message.Query, Description:err.Error()[5:]}
        case "sql":
            message.Error = structures.Error{Code:2, Type:message.Query, Description:err.Error()[5:]}
        default:
            message.Error = structures.Error{Code:0, Type:message.Query, Description:err.Error()}
        }
	}

	ws.Client.Send <- message
}
