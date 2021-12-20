LAMBDAS=$(shell for l in $$(ls . | grep -v test.js | grep -v README.md | grep -v Makefile);do echo ./$$l;done)

.PHONY: build $(LAMBDAS)

build: $(LAMBDAS)

$(LAMBDAS):
	$(MAKE) -C $@
