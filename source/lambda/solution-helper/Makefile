NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip
RESOURCES := $(shell  find . | grep -v test )

$(DST): $(RESOURCES) 
	echo "Building $(NAME)"; python3 -m virtualenv venv; source ./venv/bin/activate; pip3 install -r requirements.txt -t ./py_modules; deactivate; rm -rf venv; zip -r -q $(DST) .

