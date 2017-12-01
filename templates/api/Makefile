BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

$(DST):./* ./routes/* ./routes/templates/* ./signup/* ./style/*
	 $(BUILD) $(NAME)
