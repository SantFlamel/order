package main

import (
    "github.com/gorilla/websocket"
    "encoding/json"
    "io"
    "log"
    "net"
    "net/http"
    "sync"
    "github.com/pborman/uuid"
)

var clientList = make(map[ClientConn]int)
var clientListRWMutex sync.RWMutex

type ClientConn struct {
    uuid      string
    websocket *websocket.Conn
    ip        net.Addr
}

func main() {
    http.HandleFunc("/", wsHandler)
    http.ListenAndServe(":9000", nil)
}

func addClient(clientconnection ClientConn) {
    clientListRWMutex.Lock()
    clientList[clientconnection] = 0
    clientListRWMutex.Unlock()

    sendMessage(clientconnection, []byte(clientconnection.uuid))
    broadcastUuidList()
}

func removeClient(clientconnection ClientConn) {
    clientListRWMutex.Lock()
    delete(clientList, clientconnection)
    clientListRWMutex.Unlock()

    // !!!THIS IS WHERE IT FAILS!!!
    broadcastUuidList()
}

func sendMessage(clientconnection ClientConn, message []byte) {
    clientconnection.websocket.WriteMessage(1, message)
}

func broadcastUuidList() {
    var uuidlist []string

    // I did lock it and unlock it right after accessing the list
    clientListRWMutex.RLock()
    for client, _ := range clientList {
        uuidlist = append(uuidlist, client.uuid)
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

    for client, _ := range clientList {
        err := client.websocket.WriteMessage(messageType, message)
        if err != nil {
            log.Println("Failed to send message to client, " + client.ip.String())
            log.Fatal(err)
        }
    }
}

func wsHandler(rw http.ResponseWriter, req *http.Request) {
    conn, err := websocket.Upgrade(rw, req, nil, 1024, 1024)

    if _, hsErr := err.(websocket.HandshakeError); hsErr {
        http.Error(rw, "Websocket Handshake: Invalid request type", 400)
        return
    } else if err != nil {
        log.Println(err)
        return
    }

    uuid := uuid.New()
    client := conn.RemoteAddr()
    socketClient := ClientConn{uuid, conn, client}
    addClient(socketClient)

    for {
        messageType, msg, err := conn.ReadMessage()
        if err != nil {
            removeClient(socketClient)

            if !(err == io.EOF || err == io.ErrUnexpectedEOF) {
                log.Println(err)
            }

            return
        }

        broadcastMessage(messageType, msg)
    }
}

