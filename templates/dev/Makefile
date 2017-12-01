BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/dev

all:$(DST)/*.json

$(DST)/domain.json:./domain.*
	 $(BUILD) $(NAME)/domain

$(DST)/bucket.json:./bucket.*
	 $(BUILD) $(NAME)/bucket

$(DST)/lex.json:./lex.*
	 $(BUILD) $(NAME)/lex

$(DST)/cognito.json:./cognito.*
	 $(BUILD) $(NAME)/cognito

$(DST)/es.json:./es.*
	 $(BUILD) $(NAME)/es

$(DST)/master.json:./master.*
	 $(BUILD) $(NAME)/master


