NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip
$(DST): index.js lib/* package.json 
	echo "Building $(NAME)"; npm install && zip -r -q $(DST) .

