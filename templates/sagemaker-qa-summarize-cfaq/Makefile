BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

default: sagemaker-cfaq-stack

sagemaker-cfaq-stack:
	 $(BUILD) --stack $(NAME) --verbose
