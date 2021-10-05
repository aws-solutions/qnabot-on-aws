TEMPLATES=$(shell for l in $$(ls ./templates | grep -v util | grep -v README.md);do echo templates/$$l;done)

All: assets templates lambda website make_directories

build: All

make_directories:
	mkdir -p build; mkdir -p build/lambda; mkdir -p build/templates/test;mkdir -p build/templates;mkdir -p build/documents; mkdir -p build/templates/dev

.PHONY: lambda templates upload website test bootstrap assets config.aws-solutions.json

config.json:
	node bin/config.js > config.json

config.aws-solutions.json:
	node bin/config.js buildType=AWSSolutions > config.json

lambda:  make_directories
	make -C ./lambda

bootstrap: make_directories
	$(MAKE) ../../build/templates/dev/bootstrap.json -C templates/dev

templates: $(TEMPLATES) make_directories
	for l in $(TEMPLATES); do	\
		$(MAKE) -C $$l;			\
	done;

website: make_directories
	$(MAKE) -C ./website

assets: make_directories
	$(MAKE) -C ./assets

samples:docs/blog-samples.json make_directories
	cp docs/blog-samples.json build/documents

upload: templates lambda website make_directories assets
	./bin/upload.sh

test: make_directories
	$(MAKE) -C test
