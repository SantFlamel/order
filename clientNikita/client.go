package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net"
	"io"
)



func Error(err error) {
	panic(err)
	fmt.Println("!!!!!!!!!!", err)
}

func send(sendMessage []byte, conn net.Conn) {

	//println("Message:", string(sendMessage))
	LenMess, err := conn.Write(sendMessage)
	if err != nil {
		fmt.Println("ERROR:The message is not gone - ", LenMess, err)
		println("The message is not gone", err.Error())
		return
	}
	println("The message is gone")
}

func main() {
	cert2_b, err := ioutil.ReadFile("cert2.pem")
	if err != nil {
		panic(err)
	}
	priv2_b, err := ioutil.ReadFile("cert2.key")
	if err != nil {
		panic(err)
	}
	priv2, err := x509.ParsePKCS1PrivateKey(priv2_b)
	if err != nil {
		panic(err)
	}

	cert := tls.Certificate{
		Certificate: [][]byte{cert2_b},
		PrivateKey:  priv2,
	}
	 
	config := tls.Config{
		Certificates: []tls.Certificate{cert}, InsecureSkipVerify: true}
	conn, err := tls.Dial("tcp", "192.168.0.132:441", &config)
	if err != nil {
		panic(err)
	}

	defer conn.Close()
	//fmt.Println("client: connected to: ", conn.RemoteAddr())

	/*state := conn.ConnectionState()
	for _, v := range state.PeerCertificates {
		fmt.Println(x509.MarshalPKIXPublicKey(v.PublicKey))
		fmt.Println(v.Subject)
	}*/
	reply := make([]byte, 2160)
	//	reply2 := make([]byte, 16384)
	//	fmt.Println("client: handshake: ", state.HandshakeComplete)
	//	fmt.Println("client: mutual: ", state.NegotiatedProtocolIsMutual)

	/************************ PING  ********************************/
	conn.Write([]byte("{\"Table\":\"Session\",\"Query\":\"Read\",\"TypeParameter\":\"Hash\",\"Values\":[\"94cf8307be3a50abe776132ca0ab18b53c6de12a47cafdbcd3970aa5877a8cde\"]}"))
	//conn.Read(reply)

	//d := json.NewDecoder(conn)
	//var i interface{}
	//n,_:=d.Decode(&i)

	n,err:=io.ReadFull(conn,reply)
	println(string(reply),n)
}
