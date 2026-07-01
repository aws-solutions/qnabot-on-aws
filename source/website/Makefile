SOURCES:=$(shell find . -type f -not -path "./build/*")
.PHONY: build test dev

../build/website.zip:$(SOURCES)
	export NODE_ENV=production; make build -B

dev:$(SOURCES)
	export NODE_ENV=dev; make build -B

build:
	cd .. && npm run build:website

test:
	cd .. && npm run test:website

