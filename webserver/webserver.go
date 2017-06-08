package webserver

import (
    "project/order/conf"
    "github.com/gin-gonic/gin"
    "net/http"
    "fmt"
    "project/order/structures"
    "sync"
    "log"
)



func RegisterRoutes() {
    r:=gin.Default()
    r.LoadHTMLGlob("webserver/templates/html/**/*.html")

    r.GET("/ws",func(c *gin.Context){
        var mu sync.Mutex
        mu.Lock()
        defer mu.Unlock()
        WSHandler(c.Writer,c.Request)
    })

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
    r.GET("/cassir/", func(c *gin.Context){

        c.HTML(http.StatusOK, "cassir.html",
            gin.H{
                "title"    :"I am",
                "hreforder":"orders",
            })
    })
    r.GET("/operator/", func(c *gin.Context){

        c.HTML(http.StatusOK, "operator.html",
            gin.H{
                "title"    :"I am",
                "hreforder":"orders",
            })
    })
    r.GET("/cook/", func(c *gin.Context){

        c.HTML(http.StatusOK, "sushimaker-list.html",
            gin.H{
                "title"    :"I am",
                "hreforder":"orders",
            })
    })

    //----ПОСТ ЗАПРОСЫ
    r.POST("/poststruct/", func(c *gin.Context){
        t := c.PostForm("phone")
        println("I AM POST METHOD")
        println(t)
    })

    r.POST("/", func(c *gin.Context){

        userhash := c.PostForm("userhash")
        qmessage := c.PostForm("qmessage")

        println("I AM POST METHOD")
        println(userhash)
        println(qmessage)
        cl:=structures.ClientList[userhash]
        st:=structure{Client: &cl}
        err := st.SelectTables([]byte(qmessage))
        if err != nil {
            //log.Println("00:" + st.qm.ID_msg + "{" + st.qm.Table + " ERROR " + st.qm.Query + ", TYPE PARAMETERS \"" + st.qm.TypeParameter + "\" VALUES: "+fmt.Sprintf("%v",st.qm.Values)+": " + err.Error())
            log.Println("00:" + st.qm.ID_msg + "{" + st.qm.Table + " ERROR " + st.qm.Query + ", TYPE PARAMETERS \"" + st.qm.TypeParameter + "\" VALUES: "+fmt.Sprintf("%v",st.qm.Values)+": " + err.Error())
            println("00:" + st.qm.ID_msg + "{" + st.qm.Table + " ERROR " + st.qm.Query + ", TYPE PARAMETERS \"" + st.qm.TypeParameter + "\" VALUES: "+fmt.Sprintf("%v",st.qm.Values)+": " + err.Error())
        }
        if err!=nil {println(err.Error())}
        c.HTML(http.StatusOK, "index.html",
            gin.H{
                "title"    :"I am",
                "hreforder":"orders",
            })
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