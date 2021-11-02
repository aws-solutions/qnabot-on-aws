NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip

echo "Building $(NAME)"; pip3 install -r requirements.txt -t . && zip -r -q $(DST) .

