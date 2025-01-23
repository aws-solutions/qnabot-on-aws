BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

default: streamingstack

streamingstack:
	 $(BUILD) --stack $(NAME) --verbose
