package structures

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"net"
	"project/order/conf"
	"strconv"
	"io"
	"log"
    "errors"
	"sync"
)
var GuardClientTLS *sync.RWMutex

func init()  {
	GuardClientTLS = &sync.RWMutex{}
}

type ClientOrder struct {
	Conn    net.Conn
	IP      string
	MSG     []byte
 	read    []byte
	lenRead int
	err error
}

func (co *ClientOrder) ClientSend(serv string) (error) {
	GuardClientTLS.Lock()

	////----READ_PEM_FILE_CERTIFICATES
	//cert_b, err := ioutil.ReadFile(conf.Config.TLS_pem)
	//if err != nil {
	//	println(recover(), err.Error())
	//	log.Println(recover(), err.Error())
	//	return err
	//}
    //
	////----READ_KEY_FILE_CERTIFICATES
	//key_b, err := ioutil.ReadFile(conf.Config.TLS_key)
	//if err != nil {
	//	println(recover(), err.Error())
	//	log.Println(recover(), err.Error())
	//	return err
	//}
    //
	////----RETURN_PRIVATE_KEY_RSA
	//priv, err := x509.ParsePKCS1PrivateKey(key_b)
	//if err != nil {
	//	println(recover(), err.Error())
	//	log.Println(recover(), err.Error())
	//	return err
	//}
    //
	////----CHAIN_OF_CERTIFICATES
	//cert := tls.Certificate{
	//	//----PEM_FILE
	//	Certificate: [][]byte{cert_b},
	//	//----KEY_FILE
	//	PrivateKey: priv,
	//}
    //
	////----TLS_CONNECTION_CONFIGURATION
	//config := &tls.Config{
	//	Certificates:       []tls.Certificate{cert},
	//	InsecureSkipVerify: true}

	cert2_b, err := ioutil.ReadFile(conf.Config.TLS_pem)
	if err != nil {
		log.Println("MSG CLIEN TLS:", err.Error())
		return errors.New("MSG CLIEN TLS: "+err.Error())
	}
	priv2_b, err := ioutil.ReadFile(conf.Config.TLS_key)
	if err != nil {
		log.Println("MSG CLIEN TLS:", err.Error())
		return errors.New("MSG CLIEN TLS: "+err.Error())
	}
	priv2, err := x509.ParsePKCS1PrivateKey(priv2_b)
	if err != nil {
		log.Println("MSG CLIEN TLS:", err.Error())
		return errors.New("MSG CLIEN TLS: "+err.Error())
	}

	cert := tls.Certificate{
		Certificate: [][]byte{cert2_b},
		PrivateKey:  priv2,
	}

	config := &tls.Config{
		Certificates: []tls.Certificate{cert},
		InsecureSkipVerify: true,
	}
	GuardClientTLS.Unlock()
	//----CREATE_CONNECTION
	conn, err := tls.Dial("tcp", serv, config)
	if err != nil {
		println("client: ", err.Error())
		log.Println("client: ", err.Error())
		return err
	}

	//----REMOTE_ADDRESS
	//log.Println("client: connected to: ", conn.RemoteAddr())
	//log.Println("TLS client: connected -", conn.RemoteAddr())

	//state := conn.ConnectionState()

	//log.Println("client: handshake: ", state.HandshakeComplete)
	//log.Println("client: mutual: ", state.NegotiatedProtocolIsMutual)
	//log.Println("client: handshake: ", state.HandshakeComplete)
	//log.Println("client: mutual: ", state.NegotiatedProtocolIsMutual)

	co.Conn = conn
	return err
}


func (co *ClientOrder) Write()error{
	err := co.ClientSend(co.IP)
    if err==nil {
        s := strconv.Itoa(len(co.MSG))
        println(len(s))
        if len(s) < 4 {
            for len(s) < 4 {
                s = "0" + s
            }
        }
        co.MSG = append([]byte(s), co.MSG...)

        println("send to server )", co.Conn.RemoteAddr().String(), ":", string(co.MSG))
        if err == nil && co.Conn != nil {
            _, err = co.Conn.Write(co.MSG)
        }
        if err != nil {
            //log.Println(err)
            log.Println(err)
            println("-------------", err.Error())
        }
    }
	return err
}

func (co *ClientOrder) Read()([]byte,int,error){
	co.read = make([]byte,4)
    if co.Conn==nil{return []byte(""),0,errors.New("connection refused")}
	if co.Conn!=nil {
		co.lenRead, co.err = co.Conn.Read(co.read)
		if co.err == nil {
			co.lenRead, co.err = strconv.Atoi(string(co.read))
			if co.err == nil {
				co.read = make([]byte, co.lenRead)
				_, co.err = io.ReadFull(co.Conn, co.read)
			}
		}
	}
	if co.err!=nil{
		println("co *ClientOrder READ")
		return nil,0,co.err
	}

	return co.read,co.lenRead,co.err
}