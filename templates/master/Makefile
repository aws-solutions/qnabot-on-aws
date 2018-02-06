BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json
LAMBDA_DIR=../../lambda
LAMBDA_DST=../../build/lambda
.PHONY: $(LAMBDA_DST)/examples.zip
LAMBDA=$(LAMBDA_DST)/proxy-es.zip $(LAMBDA_DST)/import.zip $(LAMBDA_DST)/lex-build.zip $(LAMBDA_DST)/examples.zip

$(DST):./* ./routes/* ./routes/*/* ./signup/* ./style/*  $(LAMBDA) ../../build/assets.zip
	 $(BUILD) --stack $(NAME) --verbose

../../build/assets.zip:../../assets/*
	make -C  ../../assets

$(LAMBDA_DST)/examples.zip:./examples/**
	make -C ./examples

$(LAMBDA_DST)/import.zip:$(LAMBDA_DIR)/import/*
	make -C $(LAMBDA_DIR)/import 

$(LAMBDA_DST)/proxy-es.zip:$(LAMBDA_DIR)/proxy-es/*
	make -C $(LAMBDA_DIR)/proxy-es

$(LAMBDA_DST)/lex-build.zip:$(LAMBDA_DIR)/lex-build/*
	make -C $(LAMBDA_DIR)/lex-build

