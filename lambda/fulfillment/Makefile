NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip
$(DST): index.js package.json lib/* router/* 
	echo "Building $(NAME)"; npm install && zip -r -q $(DST) .
