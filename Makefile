BUCKET=$(shell bin/exports.js | $(shell npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$(shell node -e "console.log(JSON.stringify(require('./config')))" | $(shell npm bin)/jq --raw-output '."publicPrefix"')
.PHONY: lambda templates upload
prefix:
	echo "$(PREFIX)"

build:
	mkdir -p build; mkdir -p build/lambda; mkdir -p build/templates;mkdir -p build/documents
CFN_USER=lambda/cfn-user
CFN_USER_FILES=$(CFN_USER)/index.js $(CFN_USER)/library/*.js
$(CFN_USER)/node_modules: $(CFN_USER)/package.json
	cd lambda/cfn-user && rm -rf node_modules;  npm install -f
build/lambda/cfn-user.zip:build $(CFN_USER)/node_modules $(CFN_USER_FILES)
	./bin/lambda.sh cfn-user

HANDLER=lambda/handler
HANDLER_FILES=$(HANDLER)/index.js $(HANDLER)/lib/*.js
$(HANDLER)/node_modules: $(HANDLER)/package.json
	cd lambda/handler && rm -rf node_modules;  npm install -f
build/lambda/handler.zip:build $(HANDLER)/node_modules $(HANDLER_FILES)
	./bin/lambda.sh handler

ES=lambda/cfn-es
ES_FILES=$(ES)/index.js $(ES)/lib/*.js
$(ES)/node_modules:$(ES)/package.json
	cd lambda/cfn-es && rm -rf node_modules;  npm install -f
build/lambda/cfn-es.zip:build $(ES)/node_modules $(ES_FILES)
	./bin/lambda.sh cfn-es

S3=lambda/cfn-s3
S3_FILES=$(S3)/handler.js $(S3)/library/index.js $(S3)/library/lib/*.js
$(S3)/node_modules:$(S3)/package.json
	cd lambda/cfn-s3 && rm -rf node_modules;  npm install -f
build/lambda/cfn-s3.zip:build $(S3)/node_modules $(S3_FILES)
	./bin/lambda.sh cfn-s3

LEX=lambda/cfn-lex
LEX_FILES=$(LEX)/index.js $(LEX)/library/index.js
$(LEX)/node_modules:$(LEX)/package.json
	cd lambda/cfn-lex && rm -rf node_modules;  npm install -f
build/lambda/cfn-lex.zip:build $(LEX)/node_modules $(LEX_FILES)
	./bin/lambda.sh cfn-lex

VARIABLE=lambda/cfn-variable
VARIABLE_FILES=$(VARIABLE)/index.js
$(VARIABLE)/node_modules:$(VARIABLE)/package.json
	cd lambda/cfn-variable && rm -rf node_modules;  npm install -f
build/lambda/cfn-variable.zip:build $(VARIABLE)/node_modules $(VARIABLE_FILES)
	./bin/lambda.sh cfn-variable

lambda:build/lambda/cfn-lex.zip  build/lambda/cfn-s3.zip build/lambda/cfn-es.zip build/lambda/handler.zip build/lambda/cfn-user.zip build/lambda/cfn-variable.zip

templates/master.json:templates/master-base.json
	./bin/master.js

templates/dashboard.json:templates/dashboard-base.json templates/dashboard-body.json
	./bin/dashboard.js

templates/lex.json:templates/lex-base.json
	./bin/lex.js

templates/api.json:templates/api/*
	./bin/api.js

build/templates:templates/*.json templates/*.yml templates/master.json templates/dev/*.json 
	rm -rf ./build/templates/* ; cp -r ./templates/* ./build/templates

templates:build build/templates templates/api.json templates/lex.json templates/dashboard.json templates/master.json

website:website/admin/assets  website/admin/config website/admin/js website/admin/style website/admin/entry.js  website/admin/html/*
	node_modules/.bin/webpack --config ./website/admin/config/webpack.config.js

samples:docs/blog-samples.json
	cp docs/blog-samples.json build/documents

upload: templates lambda website
	aws s3 sync build s3://$(BUCKET)/$(PREFIX) --delete


