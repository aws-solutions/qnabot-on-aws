BUCKET=$(shell bin/exports.js | $(shell npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$(shell bin/exports.js | $(shell npm bin)/jq --raw-output '."QNA-BOOTSTRAP-PREFIX"')

LAMBDAS=$(shell for l in $$(ls ./lambda | grep -v util);do echo lambda/$$l;done)
TEMPLATES=$(shell for l in $$(ls ./templates | grep -v util);do echo templates/$$l;done)

build:
	mkdir -p build; mkdir -p build/lambda; mkdir -p build/templates/test;mkdir -p build/templates;mkdir -p build/documents; mkdir -p build/templates/dev

.PHONY: lambda templates upload

lambda: $(LAMBDAS)
	for l in $^; do \
		cd $$l && make; \
		cd ../..;	\
	done;			

templates: $(TEMPLATES)
	for l in $^; do \
		cd $$l && make; \
		cd ../..;	\
	done;			


website:website/assets  website/config website/js website/style website/entry.js  website/html/* build
	node_modules/.bin/webpack --config ./website/config/webpack.config.js

samples:docs/blog-samples.json build
	cp docs/blog-samples.json build/documents

upload: templates lambda website build
	./bin/upload.sh


