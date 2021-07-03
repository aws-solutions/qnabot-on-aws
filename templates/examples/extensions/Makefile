PWD=$(shell pwd)
DSTDIR=$(PWD)/../../../build/lambda/
# Remove obsolete KendraFallback folder from the build system - removed in github but needs local removal
JS_LAMBDAS=$(shell rm -rf js_lambda_hooks/KendraFallback; for l in $$(ls js_lambda_hooks);do echo $$l;done)
PY_LAMBDAS=$(shell for l in $$(ls py_lambda_hooks);do echo $$l;done)

all : js_build py_build pkg_imports
.PHONY: all 

js_build:
	for l in $(JS_LAMBDAS) ; do \
		pushd ./js_lambda_hooks/$$l ; \
		rm -fr node_modules $(DSTDIR)/EXT$$l.zip ; \
		[ -f package.json ] && \
			npm install --production || true ; \
		zip -r -q $(DSTDIR)/EXT$$l.zip . ; \
		popd ; \
	done;
	
py_build:
	for l in $(PY_LAMBDAS); do \
		pushd ./py_lambda_hooks/$$l ; \
		rm -fr py_modules $(DSTDIR)/EXT$$l.zip ; \
		[ -f requirements.txt ] && \
			python3 -m pip install --upgrade -r requirements.txt -t ./py_modules || true ; \
		zip -r -q $(DSTDIR)/EXT$$l.zip . ; \
		popd ; \
	done;

pkg_imports:
	pushd ui_imports; \
	npm install; \
	zip -r -q $(DSTDIR)/EXTUiImports.zip ./ui_import.js ./content ./node_modules; \
	popd;

