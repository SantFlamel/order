package main

import (
    "time"
)


func main() {
    t := time.Now()
    println(t.String()[:10] + "T" + t.String()[11:19])
}