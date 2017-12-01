BUCKET=$(shell bin/exports.js | $(shell npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$(shell bin/exports.js | $(shell npm bin)/jq --raw-output '."QNA-BOOTSTRAP-PREFIX"')

LAMBDAS=$(shell for l in $$(ls ./lambda | grep -v util);do echo lambda/$$l;done)

.PHONY: lambda templates upload
prefix:
	echo "$(BUCKET)"

build:
	mkdir -p build; mkdir -p build/lambda; mkdir -p build/templates/test;mkdir -p build/templates;mkdir -p build/documents; mkdir -p build/templates/dev

lambda: $(LAMBDAS)
	for l in $^; do \
		cd $$l && make; \
		cd ../..;	\
	done;			

build/templates/dev/domain.json:templates/dev/domain.js
	./bin/build.js dev/domain
build/templates/dev/bucket.json:templates/dev/bucket.js
	./bin/build.js dev/bucket
build/templates/dev/lex.json:templates/dev/lex.js
	./bin/build.js dev/lex
build/templates/dev/cognito.json:templates/dev/cognito.js
	./bin/build.js dev/cognito
build/templates/dev/es.json:templates/dev/es.js
	./bin/build.js dev/es
build/templates/dev/master.json:templates/dev/master.js
	./bin/build.js dev/master

build/templates/api.json:templates/api/*
	./bin/build.js api
build/templates/domain.json:templates/domain/*
	./bin/build.js domain
build/templates/es.json:templates/es/*
	./bin/build.js es
build/templates/lex.json:templates/lex/*
	./bin/build.js lex
build/templates/dashboard.json:templates/dashboard/*
	./bin/build.js dashboard
build/templates/master.json:templates/master/*
	./bin/build.js master
build/templates/public.json:templates/public.js
	./bin/build.js public
build/templates/bootstrap.json:templates/bootstrap.json
	./bin/build.js bootstrap

templates:build build/templates/api.json build/templates/domain.json build/templates/es.json build/templates/lex.json build/templates/dashboard.json build/templates/master.json build/templates/public.json build/templates/dev.json build/templates/bootstrap.json build/templates/dev/domain.json build/templates/dev/cognito.json build/templates/dev/bucket.json build/templates/dev/lex.json build/templates/dev/es.json build/templates/dev/master.json

website:website/assets  website/config website/js website/style website/entry.js  website/html/* build
	node_modules/.bin/webpack --config ./website/config/webpack.config.js

samples:docs/blog-samples.json build
	cp docs/blog-samples.json build/documents

upload: templates lambda website build
	./bin/upload.sh


