TEMPLATES=$(shell for l in $$(ls ./templates | grep -v util | grep -v README.md);do echo templates/$$l;done)

All: assets templates lambda website build

build:
	mkdir -p build; mkdir -p build/lambda; mkdir -p build/templates/test;mkdir -p build/templates;mkdir -p build/documents; mkdir -p build/templates/dev

.PHONY: lambda templates upload website test bootstrap

config.json:
	node bin/config.js > config.json

lambda:  build
	make -C ./lambda

bootstrap: build
	$(MAKE) ../../build/templates/dev/bootstrap.json -C templates/dev

templates: $(TEMPLATES) build
	for l in $(TEMPLATES); do	\
		$(MAKE) -C $$l;			\
	done;			

website: build
	$(MAKE) -C ./website

assets: build 
	$(MAKE) -C ./assets

samples:docs/blog-samples.json build
	cp docs/blog-samples.json build/documents

upload: templates lambda website build assets
	./bin/upload.sh

test: build 
	$(MAKE) -C test
