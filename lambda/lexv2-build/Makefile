NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip

RESOURCES := $(shell  find . | grep -v node_modules | grep -v test )

$(DST): $(RESOURCES) 
	echo "Building $(NAME)"; python3 -m pip install -t ./py_modules crhelper || true; zip -r -q $(DST) .
