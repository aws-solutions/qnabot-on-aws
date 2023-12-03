BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

default: sagemaker-qa-summarize-stack

sagemaker-qa-summarize-stack:
	 $(BUILD) --stack $(NAME) --verbose
