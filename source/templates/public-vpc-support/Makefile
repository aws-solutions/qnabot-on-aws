BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

$(DST):./* ../../config.json ../master ../../build/templates/public.json
	 $(BUILD) --stack $(NAME) --verbose
