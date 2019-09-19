BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json
LAMBDA_DST=../../build/lambda

default: importstack

importstack:
	 $(BUILD) --stack $(NAME) --verbose
