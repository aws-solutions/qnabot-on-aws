BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

$(DST):./* ../../config.json
	 $(BUILD) --stack $(NAME) --verbose
