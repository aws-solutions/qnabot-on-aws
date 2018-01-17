BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

$(DST):./*
	 $(BUILD) --stack $(NAME) --verbose
