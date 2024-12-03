NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip

RESOURCES := $(shell  find . | grep -v node_modules | grep -v test )

$(DST): $(RESOURCES) 
	echo "Building $(NAME)"; 
	rm -r ./nodejs || true
	rm -r ./node_modules || true
	npm install  -production
	mkdir ./nodejs 
	mv node_modules ./nodejs/node_modules 
	rm -r $(DST) || true
	zip -r $(DST) .