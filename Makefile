BUCKET=$(shell bin/exports.js | $(shell npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$(shell node -e "console.log(JSON.stringify(require('./config')))" | $(shell npm bin)/jq --raw-output '."publicPrefix"')
.PHONY: lambda templates upload
prefix:
	echo "$(PREFIX)"

build:
	mkdir -p build; mkdir -p build/lambda; mkdir -p build/templates;mkdir -p build/documents
LAMBDAS=$(shell for l in $$(ls ./lambda | grep -v util);do echo lambda/$$l;done)

lambda: $(LAMBDAS)
	for l in $^; do \
		cd $$l && make; \
		cd ../..;	\
	done;			

templates/master.json:templates/master-base.json
	./bin/master.js

templates/dashboard.json:templates/dashboard-base.json templates/dashboard-body.json
	./bin/dashboard.js

templates/lex.json:templates/lex-base.json
	./bin/lex.js

templates/api.json:templates/api/*
	./bin/build.js api

build/templates:templates/*.json templates/*.yml templates/master.json templates/dev/*.json 
	rm -rf ./build/templates/* ; cp -r ./templates/* ./build/templates

templates:build build/templates templates/api.json templates/lex.json templates/dashboard.json templates/master.json build

website:website/admin/assets  website/admin/config website/admin/js website/admin/style website/admin/entry.js  website/admin/html/* build
	node_modules/.bin/webpack --config ./website/admin/config/webpack.config.js

samples:docs/blog-samples.json build
	cp docs/blog-samples.json build/documents

upload: templates lambda website build
	aws s3 sync build s3://$(BUCKET)/$(PREFIX) --delete


