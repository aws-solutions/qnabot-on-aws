#! /bin/bash

docker run -d -p 4444:4444 --shm-size=2g selenium/standalone-chrome:3.8.1-erbium
