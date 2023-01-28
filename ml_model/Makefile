MODELS=$(shell for l in $$(ls . | grep -v README.md | grep -v Makefile);do echo ./$$l;done)

.PHONY: build $(MODELS)

build: $(MODELS)

$(MODELS):
	$(MAKE) -C $@
