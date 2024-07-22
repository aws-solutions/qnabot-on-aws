BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json
LAMBDA_DST=../../build/lambda
.PHONY: lambda examples extensions

$(DST):./* examples extensions
	 $(BUILD) --stack $(NAME) --verbose && $(BUILD) --stack public --verbose

../../build/assets.zip:../../assets/*
	make -C  ../../assets

lambda:
	make -C ../../lambda

examples:./examples/**
	make -C ./examples

extensions:./extensions/**
	make -C ./extensions
