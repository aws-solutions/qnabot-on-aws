BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/dev

all:$(DST)/bucket.json $(DST)/cognito.json $(DST)/master.json  $(DST)/bootstrap.json $(DST)/lambda.json $(DST)/api.json

$(DST)/bootstrap.json:./bootstrap/*
	 $(BUILD) --stack $(NAME)/bootstrap --verbose

$(DST)/api.json:./api.*
	 $(BUILD) --stack  $(NAME)/api --verbose

$(DST)/lambda.json:./lambda.*
	 $(BUILD) --stack  $(NAME)/lambda --verbose

$(DST)/bucket.json:./bucket.*
	 $(BUILD) --stack  $(NAME)/bucket --verbose

$(DST)/cognito.json:./cognito.*
	 $(BUILD) --stack  $(NAME)/cognito --verbose

$(DST)/master.json:./master.* ../master/*
	 $(BUILD) --stack  $(NAME)/master --verbose


