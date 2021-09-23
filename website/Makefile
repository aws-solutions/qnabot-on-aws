SOURCES:=$(shell find . -type f -not -path "./build/*")
.PHONY: build test dev

../build/website.zip:$(SOURCES)
	export NODE_ENV=prod; make build -B

dev:$(SOURCES)
	export NODE_ENV=dev; make build -B

build:
	cd ..
	npm i webpack-merge -D
	npx webpack-cli --config ./config/webpack.config.js

test:
	cd ..
	npm i webpack-merge -D
	npx webpack-cli --config ./config/test.config.js

