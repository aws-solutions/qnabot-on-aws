BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/dev

all:$(DST)/domain.json $(DST)/bucket.json $(DST)/lex.json $(DST)/cognito.json $(DST)/master.json  $(DST)/bootstrap.json $(DST)/lambda.json

$(DST)/bootstrap.json:./bootstrap.json
	 cp ./bootstrap.json $(DST)/bootstrap.json

$(DST)/domain.json:./domain.*
	 $(BUILD) $(NAME)/domain

$(DST)/lambda.json:./lambda.*
	 $(BUILD) $(NAME)/lambda

$(DST)/bucket.json:./bucket.*
	 $(BUILD) $(NAME)/bucket

$(DST)/lex.json:./lex.*
	 $(BUILD) $(NAME)/lex

$(DST)/cognito.json:./cognito.*
	 $(BUILD) $(NAME)/cognito

$(DST)/master.json:./master.*
	 $(BUILD) $(NAME)/master


