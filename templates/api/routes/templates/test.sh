#! /bin/bash

$(npm bin)/nodeunit ./test.js -f "root - $1"
