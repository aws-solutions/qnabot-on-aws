#! /bin/bash

STATUS=$(curl localhost:4444/wd/hub/status | ../../bin/json.js value.ready 2> /dev/null)
if [ "$STATUS" == "true" ];then
    echo "ready"
else
    echo "starting"
    docker run -d -p 4444:4444 --shm-size=2g selenium/standalone-chrome:3.8.1-erbium
fi
