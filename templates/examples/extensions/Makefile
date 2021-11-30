# Using `-e` in bash shell to stop build on failures during multiline build script sections
SHELL := bash -e
CURDIR=$(shell pwd)
DSTDIR=$(CURDIR)/../../../build/lambda/
# Remove obsolete KendraFallback folder from the build system - removed in github but needs local removal
JS_LAMBDAS=$(shell rm -rf js_lambda_hooks/KendraFallback; for l in $$(ls js_lambda_hooks);do echo $$l;done)
PY_LAMBDAS=$(shell for l in $$(ls py_lambda_hooks);do echo $$l;done)

all : js_build py_build pkg_imports
js_build: $(JS_LAMBDAS)
py_build: $(PY_LAMBDAS)

.PHONY: all
.PHONY: $(JS_LAMBDAS) $(PY_LAMBDAS)

$(JS_LAMBDAS):
	@echo "--> Building js_lambda_hooks/$@"
	cd ./js_lambda_hooks/$@ ; \
	rm -fr node_modules $(DSTDIR)/EXT$@.zip ; \
	[ -f package.json ] && \
		npm install --production ; \
	zip -r -q $(DSTDIR)/EXT$@.zip .

$(PY_LAMBDAS):
	@echo "--> Building py_lambda_hooks/$@"
	cd ./py_lambda_hooks/$@ ; \
	rm -fr py_modules $(DSTDIR)/EXT$@.zip ; \
	[ -f requirements.txt ] && \
		python3 -m pip install --upgrade -r requirements.txt -t ./py_modules ; \
	zip -r -q $(DSTDIR)/EXT$@.zip .

pkg_imports:
	cd ui_imports; \
	npm install; \
	zip -r -q $(DSTDIR)/EXTUiImports.zip ./ui_import.js ./content ./node_modules
