NAME=$(shell basename $(shell pwd))
DST=../../build/lambda/$(NAME).zip

RESOURCES := $(shell  find . | grep -v node_modules | grep -v test )

$(DST): $(RESOURCES) 
	echo "Building $(NAME)"; 
	npm install  -production
	rm -r ./nodejs || true
	mkdir ./nodejs
	mv node_modules ./nodejs/node_modules || true
	mkdir ./nodejs/node_modules || true  #if no node_modules folder exists because there was nothing to copy, create it
	mkdir ./nodejs/node_modules/qnabot || true
	cp -R qnabot ./nodejs/node_modules/
	zip -FSr $(DST) nodejs