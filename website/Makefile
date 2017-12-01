SOURCES:=$(shell find . -type f -not -path "./build/*")
.PHONY: build

../build/website.zip:$(SOURCES)
	export NODE_ENV=prod; make build -B

dev:$(SOURCES)
	export NODE_ENV=dev; make build -B

build:
	../node_modules/.bin/webpack --config ./config/webpack.config.js

