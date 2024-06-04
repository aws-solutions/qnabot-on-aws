NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip
RESOURCES := $(shell  find . | grep -v node_modules | grep -v test )

$(DST): $(RESOURCES) 
	echo "Building $(NAME)";
	rm -r ./node_modules || true
	rm $(DST); npm install -production && zip -r -q $(DST) .
