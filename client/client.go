package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"github.com/fatih/color"
	"io/ioutil"
	"log"
	"net"
	"project/order/conf"
	"strconv"
    "io"
	"project/order/client/insert"
    "project/order/structures"
)

var reply []byte
var ID int64
var IDitem int64

func main() {
    c := Client{}
    c.Init()
}

type Client struct {
    message structures.Message
    table structures.Table
    error_str structures.Error
}

func (c *Client) Init() {
    var err error
    for _,m:=range insert.Insert() {
        c.message = m
        _, err = c.send()

        if err != nil {
            println(err.Error())
            return
        }
    }
}


//----------------------------------------------------------------------------------------------------------------------

func (c *Client)send() (string, error) {
    var st string
    var message []byte
    message, _ = json.Marshal(c.message)
    st = string(message)
    s := strconv.Itoa(len(st))
    if len(s) < 4 {
        for len(s) < 4 {
            s = "0" + s
        }
    }
    message = []byte(s + st)


	conn := Conn()
	reply = make([]byte, 4)
    println()
    println()
	println("----------------------------------")
	println(string(message))
	println("----------------------------------")
	if conn == nil {
		return "", errors.New("nil connection")
	}
	n, err := conn.Write(message)
	if err != nil {
		log.Println(n, err)
		println("Message is not gone")
		return "", err
	}
	println("Message is gone, my address: " + conn.LocalAddr().String(),"to address:",conn.RemoteAddr().String())
    _, err = conn.Read(reply)
    if err != nil {
        println(err.Error())
        return "",err
    }

    n, err = strconv.Atoi(string(reply))
    if err != nil {
        println(err.Error(), string(reply))
        return "",err
    }

    reply = make([]byte, n)
    _, err = io.ReadFull(conn, reply)
    if err != nil {
        println(err.Error())
        return "",err
    }

	//----ERROR_CHECKING
	//if string(reply[:6]) == "ERROR:" {errorServer(reply[:n])}

	println("LEN_MESSAGE:", len(reply[:n]))
    err = json.Unmarshal(reply[:n],&c.message)
    if err!=nil{
        println()
        println("----JASON UNMARSHAL")
        color.Red(err.Error())
        err = nil
    }
    println()
    println("----GET MESSAGE")

	if c.message.Error != nil {
		color.Red(string(reply[:n]))
	} else {
		color.Green(string(reply[:n]))
	}
    println()
	//return string(reply[:n]), nil
	return "", nil
}



func sendReadRange(message string) {
	conn := Conn()
	reply = make([]byte, 16384)

	n, err := conn.Write([]byte(message))
	if err != nil {
		log.Println(n, err)
		println("Message is not gone")
		println(err.Error())
	}
	println("Message is gone, my address: " + conn.LocalAddr().String())
	for {
		n, err = conn.Read(reply)
		if err != nil {
			log.Println(err)
			println(err.Error())
		}

		//----ERROR_CHECKING
		//if string(reply[:6]) == "ERROR:" {errorServer(reply[:n])}

		println("LEN_MESSAGE:", len(reply[:n]))

		if len(reply[:n]) > 2 && string(reply[:n])[:2] == "00" {
			color.Red(string(reply[:n]))
			println(err.Error())
		} else {
			color.Green(string(reply[:n]))
		}
		if string(reply[:n])[3:] == "EOF" {
			break
		}
		println("--------------------------------------")
	}
	println("----------------------------------------------")
}

func Conn() net.Conn {
	//----READ_PEM_FILE_CERTIFICATES
	cert_b, err := ioutil.ReadFile("../" + conf.Config.TLS_pem)
	if err != nil {
		println(recover(), err.Error())
		println(1)
		return nil
	}

	//----READ_KEY_FILE_CERTIFICATES
	key_b, err := ioutil.ReadFile("../" + conf.Config.TLS_key)
	if err != nil {
		println(recover(), err.Error())
		println(2)
		return nil
	}

	//----RETURN_PRIVATE_KEY_RSA
	priv, err := x509.ParsePKCS1PrivateKey(key_b)
	if err != nil {
		println(recover(), err.Error())
		println(3)
		return nil
	}

	//----CHAIN_OF_CERTIFICATES
	cert := tls.Certificate{
		//----PEM_FILE
		Certificate: [][]byte{cert_b},
		//----KEY_FILE
		PrivateKey: priv,
	}

	//----TLS_CONNECTION_CONFIGURATION
	config := tls.Config{
		Certificates:       []tls.Certificate{cert},
		InsecureSkipVerify: true}

	//----GET_STRING_LISTEN_PORT
	service := conf.Config.TLS_server + ":" + conf.Config.TLS_port
	//service := "192.168.0.132:441"
	//----CREATE_CONNECTION
	conn, err := tls.Dial("tcp", service, &config)
	if err != nil {
		println("client: dial: %s", err.Error())
		log.Fatalf("client: dial: %s", err)
	}
	//----REMOTE_ADDRESS
	log.Println("client: connected to: ", conn.RemoteAddr())

	state := conn.ConnectionState()
	log.Println("client: handshake: ", state.HandshakeComplete)
	log.Println("client: mutual: ", state.NegotiatedProtocolIsMutual)
	return conn
}
