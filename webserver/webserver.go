package webserver

import (
    "project/order/conf"
    "github.com/gin-gonic/gin"
    "net/http"
    "sync"
    "log"
)



func RegisterRoutes() {
    r:=gin.Default()
    r.LoadHTMLGlob("webserver/templates/html/**/*.html")


    //----Веб сокеты
    r.GET("/ws",func(c *gin.Context){
        var mu sync.Mutex
        mu.Lock()
        defer mu.Unlock()
        ws := WS{}
        ws.WSHandler(c.Writer,c.Request)
    })


    //----Переключатель инетрфейсов
    r.GET("/", func(c *gin.Context){

        c.HTML(http.StatusOK, "index.html",
            gin.H{
                "title"    :"I am",
                "hreforder":"orders",
            })
    })


    r.GET("cook.sheldon/", func(c *gin.Context){

        c.HTML(http.StatusOK, "sushimaker-list.html",
            gin.H{
                "title"    :"I am",
                "hreforder":"orders",
            })
    })

    //----Кассирский интерфейс
    r.GET("/cassir/", func(c *gin.Context){

        c.HTML(http.StatusOK, "cassir.html",
            gin.H{
                "title"    :"I am",
                "hreforder":"orders",
            })
    })

    //----Операторский интерфейс
    r.GET("/operator/", func(c *gin.Context){

        c.HTML(http.StatusOK, "operator.html",
            gin.H{
                "title"    :"I am",
                "hreforder":"orders",
            })
    })

    //----Поворской интерфейс
    r.GET("/cook/", func(c *gin.Context){

        c.HTML(http.StatusOK, "sushimaker-list.html",
            gin.H{
                "title"    :"I am",
                "hreforder":"orders",
            })
    })

    //----Для ьестов вебсокетов
    r.GET("/client/", func(c *gin.Context){
        c.HTML(http.StatusOK, "WebSoket.html",nil)
    })

    //----ПОСТ ЗАПРОСЫ
    r.POST("/poststruct/", func(c *gin.Context){
        t := c.PostForm("phone")
        println("I AM POST METHOD")
        println(t)
    })


    r.Static("/public","./webserver/templates/public")
    println("WEB SERVER RUNNING")

    //err := http.ListenAndServeTLS(conf.Config.GIN_server + ":" + conf.Config.GIN_port, "cert/gsorganizationvalsha2g2r1.crt","cert/herong.key",r)
    err := r.Run(conf.Config.GIN_server + ":" + conf.Config.GIN_port)
    //err := r.RunTLS(conf.Config.GIN_server + ":" + conf.Config.GIN_port,"cert/certificate/certificate.crt","cert/certificate/certificate.key")
    r.RunTLS(conf.Config.GIN_server + ":" + conf.Config.GIN_port, "../Avtorization/CEPO1701279874.cer", "./Avtorization/_.yapoki.net.key")
    if err != nil {
        println(err.Error())
        //log.Println("ERROR: RUN_WEB_SERVER", err.Error())
        log.Println("ERROR: RUN_WEB_SERVER", err.Error())
    }
}