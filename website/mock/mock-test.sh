#! /bin/bash

URL=localhost:8000/api

DATA='{"Qs":["a"],"A":"h"}'

set -x
curlj -L $URL 
curlj -L -X PUT -H "Content-Type: application/json" -d $DATA $URL/ 
curlj -L -X POST $URL
curlj -L $URL/search?query=hello
curlj -L -X DELETE $URL/test
curlj -L -X PUT -H "Content-Type: application/json" -d $DATA PUT $URL/test
curlj -L $URL/health
curlj -L $URL/info
