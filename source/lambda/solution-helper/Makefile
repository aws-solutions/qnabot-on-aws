NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip
RESOURCES := $(shell  find . | grep -v test )

$(DST): $(RESOURCES) 
	echo "Building $(NAME)";
	$(POETRY_COMMAND) export --without dev -f requirements.txt --output requirements.txt --without-hashes;
	pip3 install -r requirements.txt -t ./py_modules;
	rm -f requirements.txt
	zip -r -q $(DST) . -x "*__pycache__/*" "*.pytest_cache/*"

