NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip
RESOURCES := $(shell  find . | grep -v test )

$(DST): $(RESOURCES) 
	echo "Building $(NAME)";
	zip -r -q $(DST) .