LAMBDAS=$(shell for l in $$(ls . | grep -v test.js | grep -v README.md | grep -v Makefile);do echo ./$$l;done)

.PHONY: build 

build: $(LAMBDAS)
	for l in $(LAMBDAS); do \
		$(MAKE) -C $$l;		\
	done;			

