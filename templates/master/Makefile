BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json
LAMBDA_DST=../../build/lambda
.PHONY: $(LAMBDA_DST)/examples.zip lambda

$(DST):./* ./routes/* ./routes/*/* ./signup/* ./cognito/style/* lambda 
	 $(BUILD) --stack $(NAME) --verbose

../../build/assets.zip:../../assets/*
	make -C  ../../assets

lambda:
	make -C ../../lambda

$(LAMBDA_DST)/examples.zip:./examples/**
	make -C ./examples
