BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json
LAMBDA_DIR=../../lambda/fulfillment

$(DST):./* ../../build/lambda/fulfillment.zip
	 $(BUILD) --stack $(NAME) --verbose

../../build/lambda/fulfillment.zip:$(LAMBDA_DIR)/*
	cd ../../lambda/fulfillment && make


