LAMBDAS=$(shell for l in $$(ls ./lambda | grep -v test.js | grep -v README.md);do echo lambda/$$l;done)
TEMPLATES=$(shell for l in $$(ls ./templates | grep -v util | grep -v README.md);do echo templates/$$l;done)

All: templates lambda website build

build:
	mkdir -p build; mkdir -p build/lambda; mkdir -p build/templates/test;mkdir -p build/templates;mkdir -p build/documents; mkdir -p build/templates/dev

.PHONY: lambda templates upload website test bootstrap

config.json:
	node bin/config.js > config.json

lambda: $(LAMBDAS) build
	for l in $(LAMBDAS); do \
		$(MAKE) -C $$l;		\
	done;			

bootstrap: build
	$(MAKE) -C templates/dev

templates: $(TEMPLATES) build
	for l in $(TEMPLATES); do	\
		$(MAKE) -C $$l;			\
	done;			

website: build
	$(MAKE) -C ./website

samples:docs/blog-samples.json build
	cp docs/blog-samples.json build/documents

upload: templates lambda website build
	./bin/upload.sh

test: 
	$(MAKE) -C test
