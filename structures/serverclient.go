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
    "crypto/rsa"
)
var GuardClientTLS *sync.RWMutex

func init()  {
	GuardClientTLS = &sync.RWMutex{}
}

type ClientOrder struct {
	Conn    net.Conn
	IP      string
	MSG     []byte
 	ReadB    []byte
	lenRead int
	Err error
}

func (co *ClientOrder) ClientSend(serv string){
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
    var cert2_b []byte
	cert2_b, co.Err = ioutil.ReadFile(conf.Config.TLS_pem)
	if co.Err != nil {
		log.Println("MSG CLIEN TLS:", co.Err.Error())
		co.Err = errors.New("MSG CLIEN TLS: "+ co.Err.Error())
        return
	}

    var priv2_b []byte
	priv2_b, co.Err = ioutil.ReadFile(conf.Config.TLS_key)
	if co.Err != nil {
		log.Println("MSG CLIEN TLS:", co.Err.Error())
        co.Err = errors.New("MSG CLIEN TLS: "+ co.Err.Error())
        return
	}

    var priv2 *rsa.PrivateKey
	priv2, co.Err = x509.ParsePKCS1PrivateKey(priv2_b)
	if co.Err != nil {
		log.Println("MSG CLIEN TLS:", co.Err.Error())
        co.Err = errors.New("MSG CLIEN TLS: " + co.Err.Error())
        return
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
    var conn *tls.Conn
	conn, co.Err = tls.Dial("tcp", serv, config)
	if co.Err != nil {
		println("client: ", co.Err.Error())
		log.Println("client: ", co.Err.Error())
		return
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
}


func (co *ClientOrder) Write(){
	co.ClientSend(co.IP)
    if co.Err==nil {
        s := strconv.Itoa(len(co.MSG))
        println(len(s))

        for len(s) < 4 {
            s = "0" + s
        }

        co.MSG = append([]byte(s), co.MSG...)

        println("send to server )", co.Conn.RemoteAddr().String(), ":", string(co.MSG))
        if co.Err == nil && co.Conn != nil {
            _, co.Err = co.Conn.Write(co.MSG)
        }
        if co.Err != nil {
            //log.Println(err)
            log.Println(co.Err)
            println("-------------", co.Err.Error())
        }
    }
}

func (co *ClientOrder) Read(){
	co.ReadB = make([]byte,4)
    if co.Conn==nil{co.Err = errors.New("connection refused");return }
	if co.Conn!=nil {
		co.lenRead, co.Err = co.Conn.Read(co.ReadB)
		if co.Err == nil {
			co.lenRead, co.Err = strconv.Atoi(string(co.ReadB))
			if co.Err == nil {
				co.ReadB = make([]byte, co.lenRead)
				_, co.Err = io.ReadFull(co.Conn, co.ReadB)
				if co.Err!=nil{
                    println()
					println("READ TLS:",string(co.ReadB))
                    println()
                    println("---------------------------")
				}

			}
		}
	}
	if co.Err!=nil{
		println("co *ClientOrder READ",co.Err.Error())
	}
}