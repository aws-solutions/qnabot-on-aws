NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip
$(DST): $(shell find . | grep -v node_modules)
	echo "Building $(NAME)"; npm install && zip -r -q $(DST) .

