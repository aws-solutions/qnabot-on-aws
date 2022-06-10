NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip
RESOURCES := $(shell  find . | grep -v test )

$(DST): $(RESOURCES) 
	echo "Building $(NAME)"; pip3 install -r requirements.txt -t ./py_modules && zip -r -q $(DST) .
