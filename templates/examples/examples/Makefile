NAME=$(shell basename $(shell pwd))
DST=../../../build/lambda/$(NAME).zip

all : py_build $(DST)
.PHONY: all

$(DST): index.js package.json cfn.js examples/* js/* py/*
	echo "Building $(NAME)"; npm install -production && zip -r -q $(DST) .

py_build:
		pushd ./py ; \
		[ -f requirements.txt ] && \
			python3 -m pip install --upgrade -r requirements.txt -t ./py_modules || true ; \
		popd ; \

