BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

$(DST):./* ../../config.json ../master
	 $(BUILD) --stack $(NAME) --verbose
