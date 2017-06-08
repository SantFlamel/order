package conf

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"time"
)

//Объявление структуры конфигураций.
type Configurations struct {
	Enable_service_log        bool
	Enable_order_log          bool
	Postgre_write_user        string
	Postgre_write_password    string
	Postgre_host              string
	Postgre_database          string
	Postgre_ssl               string
	TLS_server                string
	TLS_port                  string
	TLS_pem                   string
	TLS_key                   string
	TLS_serv_printer          string
	TLS_serv_product          string
	TLS_serv_session          string
	TLS_serv_tabel            string
	TLS_serv_ClientInfo       string
	TLS_serv_GlobalParameters string
	TLS_serv_areas            string
	TLS_serv_sklad            string
	TLS_serv_org              string
	GIN_server                string
	GIN_port                  string
	HashCourier               string
	HashPizzaMaster           string
	HashSushiMaster           string
	HashOperator              string
	Expired_count             int
	Connect_count             int
}

func (c *Configurations) LogPrintln(v ...interface{}) {
	if fmt.Sprint(v[len(v)-1]) != "sql: no rows in result set" {
		v = append([]interface{}{time.Now().String()[:19]}, v...)
		log.Println(v...)
	}
}

func (c *Configurations) getConfigurations() error {

	confFile, err := os.Open("config.json")

	if err != nil {
		return err
	}
	defer confFile.Close()

	stat, err := confFile.Stat()

	if err != nil {
		return err
	}

	bs := make([]byte, stat.Size())
	_, err = confFile.Read(bs)
	if err != nil {
		return err
	}

	err = json.Unmarshal(bs, &c)

	if err != nil {
		return err
	}

	return nil
}

var Config Configurations
var LogFile *os.File

func init() {

	//Чтение файла конфигураций
	err := Config.getConfigurations()

	if err != nil {
		println("--Ошибка чтения файла--", err.Error())
		log.Panic("Config file not found!: ", err)
	}

	//log.Println("Config established!")

	//if Config.Enable_service_log {
	//	go RecLog()
	//}
}

func RecLog() {
	var t1 time.Time
	var t2 time.Time
	var err error

	//for {

	//CHECK DIR
	_, err = os.Stat("./log/")
	if os.IsNotExist(err) {
		//MAKE DIR
		os.MkdirAll("./log/", 0777)
		//MAKE LOG FILE
		LogFile, err = os.OpenFile("log/"+time.Now().String()[:10]+".log", os.O_APPEND|os.O_CREATE|os.O_RDWR, 0666)
	} else {
		//MAKE LOG FILE
		LogFile, err = os.OpenFile("log/"+time.Now().String()[:10]+".log", os.O_APPEND|os.O_CREATE|os.O_RDWR, 0666)
	}

	if err != nil {
		log.Panic("Logfile not found!:", err)
	}

	log.SetOutput(&writer{LogFile, "2006-01-02 15:04:05"})
	log.SetPrefix(" - ")
	log.SetFlags(0)
	//log.SetPrefix(time.Now().String()[:19])

	log.Println()
	//log.Println("*********************************")
	//log.Println("*********************************")
	log.Println("_______NEW_START_OF_SERVER_______")

	t1 = time.Now()

	t2, err = time.Parse("2006-01-02T15:04:05.000000-05:00", t1.String()[0:10]+"T16:44:59.999999+05:00")
	if err != nil {
		return
	}
	time.Sleep(t2.Sub(t1.Add(time.Minute * 2)))
	if err = LogFile.Close(); err != nil {
		log.Println("err close: ", LogFile)
	}

	//}
}

type writer struct {
	io.Writer
	timeFormat string
}

func (w writer) Write(b []byte) (n int, err error) {
	return w.Writer.Write(append([]byte(time.Now().Format(w.timeFormat)), b...))
}
