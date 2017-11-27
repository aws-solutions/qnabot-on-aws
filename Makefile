BUCKET=$(shell bin/exports.js | $(shell npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$(shell node -e "console.log(JSON.stringify(require('./config')))" | $(shell npm bin)/jq --raw-output '."publicPrefix"')
LAMBDAS=$(shell for l in $$(ls ./lambda | grep -v util);do echo lambda/$$l;done)

.PHONY: lambda templates upload
prefix:
	echo "$(PREFIX)"

build:
	mkdir -p build; mkdir -p build/lambda; mkdir -p build/templates/test;mkdir -p build/templates;mkdir -p build/documents

lambda: $(LAMBDAS)
	for l in $^; do \
		cd $$l && make; \
		cd ../..;	\
	done;			

build/templates/handler.json:templates/handler.json
	./bin/build.js handler
build/templates/fulfilment.json:templates/fulfilment.json
	./bin/build.js fulfilment
build/templates/api.json:templates/api/*
	./bin/build.js api
build/templates/domain.json:templates/domain.js
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

templates:build build/templates/handler.json build/templates/fulfilment.json build/templates/api.json build/templates/domain.json build/templates/es.json build/templates/lex.json build/templates/dashboard.json build/templates/master.json build/templates/public.json 


website:website/admin/assets  website/admin/config website/admin/js website/admin/style website/admin/entry.js  website/admin/html/* build
	node_modules/.bin/webpack --config ./website/admin/config/webpack.config.js

samples:docs/blog-samples.json build
	cp docs/blog-samples.json build/documents

upload: templates lambda website build
	aws s3 sync build s3://$(BUCKET)/$(PREFIX) --delete


