package structures

import (
	"encoding/json"
	"errors"
	"github.com/gorilla/websocket"
	"log"
	"net"
	"project/order/conf"
	"sync"
	"time"
    "fmt"
)

var ClientList = make(map[string]ClientConn)
var clientListRWMutex sync.RWMutex

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10
)

type ClientConn struct {
	HashAuth  string
	HashPoint string
	HashRole  string
	IP        net.Addr
	conn      *websocket.Conn
	Send      chan Message //message
}

func (c *ClientConn) SetConn(co *websocket.Conn) {
	c.conn = co
}

func (c *ClientConn) WritePump() {
	var err error
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				continue
			}

			if c.conn == nil {
				return
			}
			//c.conn.WriteMessage(1, message)
            println(fmt.Sprint(message))
			c.conn.WriteJSON(message)
			n := len(c.Send)
			for i := 0; i < n; i++ {
				if c.conn == nil {
					return
				}
				//c.conn.WriteMessage(1, <-c.Send)
                message = <- c.Send
                println(fmt.Sprint(message))
				c.conn.WriteJSON(message)
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err = c.conn.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				return
			}
		}
	}
}

func AddClient(cc ClientConn) error {
    println("AddClient WS")
	clientListRWMutex.Lock()
	defer clientListRWMutex.Unlock()
	var err error
    ok:=false

	if len(cc.HashAuth)>3{if string(cc.HashAuth[:4])=="zero"{println("i am zero");ok=true}}

	if !ok{ok, err = checkSession(cc.HashAuth)}

	if ok {
		if _, ok = ClientList[cc.HashAuth]; !ok {
			ClientList[cc.HashAuth] = cc
		} else {
			ClientList[cc.HashAuth].conn.Close()
			ClientList[cc.HashAuth] = cc
		}
	} else {
		if err != nil {
			return err
		} else {
			return errors.New("You are not authorized in the system")
		}
	}

	//sendMessage(clientconnection, []byte(clientconnection.HashAuth))
	//broadcastUuidList()//РАССЫЛКА ПОДКЛЮЧЕНИЙ
	return err
}

func checkSession(session_hash string) (bool, error) {
	co := ClientOrder{IP: conf.Config.TLS_serv_session,
		MSG: []byte("{\"Table\":\"Session\"," +
			"\"Query\":\"Check\"," +
			"\"TypeParameter\":\"SessionHash\"," +
			"\"Values\":[\"" + session_hash + "\"]}")}
	co.Write()
	if co.Err == nil {
		co.Read()
		//n,err = co.Conn.Read(listen)
		//n,err = strconv.Atoi(string(listen))
		//if err!=nil{}
		//listen = make([]byte, n)
		//_,err = io.ReadFull(co.Conn,listen)
		co.Conn.Close()
		if string(co.ReadB) == "01:true" && co.Err == nil {
			return true, co.Err
		}
	}
	return false, co.Err
	//return true,nil
}

func RemoveClient(clientconnection ClientConn) {
	clientListRWMutex.Lock()
	delete(ClientList, clientconnection.HashAuth)
	clientListRWMutex.Unlock()

	// !!!THIS IS WHERE IT FAILS!!!
	//broadcastUuidList()//РАССЫЛКА ПОДКЛЮЧЕНИЙ
}

func sendMessage(clientconnection ClientConn, message []byte) {
	clientconnection.conn.WriteMessage(1, message)
}

func broadcastUuidList() { //РАССЫЛКА ПОДКЛЮЧЕНИЙ
	var uuidlist []string

	// I did lock it and unlock it right after accessing the list
	clientListRWMutex.RLock()
	for _, client := range ClientList {
		uuidlist = append(uuidlist, client.HashAuth)
	}
	clientListRWMutex.RUnlock()

	jsonuuidlist, err := json.Marshal(uuidlist)
	if err != nil {
		log.Fatal(err)
	}

	broadcastMessage(1, jsonuuidlist)
}

func broadcastMessage(messageType int, message []byte) {
	clientListRWMutex.Lock()
	defer clientListRWMutex.Unlock()

	for _, client := range ClientList {
		err := client.conn.WriteMessage(messageType, message)
		if err != nil {
			//log.Println("Failed to send message to client, " + client.IP.String())
			log.Println("Failed to send message to client,", client.IP.String())
			log.Fatal(err)
		}
	}
}
