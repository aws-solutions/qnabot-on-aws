NAME=$(shell basename $(shell pwd))
DST=../../../build/lambda/$(NAME).zip

all : py_build $(DST)
.PHONY: all

$(DST): index.js package.json cfn.js examples/* js/* py/*
	echo "Building $(NAME)"; npm install -production && zip -r -q $(DST) .

py_build:
		cd ./py ; \
		rm -fr py_modules $(DST) ; \
		[ -f pyproject.toml ] && \
			$(POETRY_COMMAND) export --without dev -f requirements.txt --output requirements.txt --without-hashes && \
			python3 -m pip install --upgrade -r requirements.txt -t ./py_modules && rm -f requirements.txt || true ; \

