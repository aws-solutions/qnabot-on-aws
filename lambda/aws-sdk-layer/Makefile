NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip

RESOURCES := $(shell  find . | grep -v node_modules | grep -v test )

$(DST): $(RESOURCES) 
	echo "Building $(NAME)"; 
	npm install -production
	rm -r ./nodejs || true
	mkdir ./nodejs 
	mv node_modules ./nodejs/node_modules
	cp -r sdk-config ./nodejs/node_modules/
	zip -r $(DST) .