TEMPLATES=$(shell for l in $$(ls ./templates | egrep -v "util|lib|README.md|jest.config.js|package.json|package-lock.json|node_modules|coverage|__tests__|.pytest_cache|.venv-test|pytest.ini|requirements.txt|requirements-test.txt");do echo templates/$$l;done)

All: ml_model assets templates lambda website make_directories

build: All

make_directories:
	mkdir -p build/ml_model build/lambda build/documents build/templates/test  build/templates/dev

.PHONY: ml_model lambda templates upload website test bootstrap assets config.aws-solutions.json
.PHONY: $(TEMPLATES)

config.json:
	node bin/config.js > config.json

config.aws-solutions.json:
	node bin/config.js buildType=AWSSolutions > config.json

ml_model:  make_directories
	make -C ./ml_model

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

upload: ml_model templates lambda website make_directories assets
	./bin/upload.sh

test: make_directories
	$(MAKE) -C test
