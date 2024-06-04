TEMPLATES=$(shell for l in $$(ls ./templates | egrep -v "util|lib|README.md|jest.config.js|package.json|package-lock.json|node_modules|coverage|__tests__|.pytest_cache|.venv-test|pytest.ini|requirements.txt|requirements-test.txt");do echo templates/$$l;done)

All: assets templates lambda website make_directories

build: All

make_directories:
	mkdir -p build/lambda build/documents build/templates/test  build/templates/dev

.PHONY: lambda templates upload website test bootstrap assets config.aws-solutions.json
.PHONY: $(TEMPLATES)

config.json:
	node bin/config.js > config.json

config.aws-solutions.json:
	node bin/config.js buildType=AWSSolutions > config.json

lambda:  make_directories
	make -C ./lambda

bootstrap: make_directories
	$(MAKE) ../../build/templates/dev/bootstrap.json -C templates/dev

templates: $(TEMPLATES)

$(TEMPLATES): make_directories
	$(MAKE) -C $@

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
