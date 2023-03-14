BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

default: sagemaker-embeddings-stack

sagemaker-embeddings-stack:
	 $(BUILD) --stack $(NAME) --verbose
