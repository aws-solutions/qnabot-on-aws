BUILD=../../bin/build.js
NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).json

$(DST):./*
	 $(BUILD) $(NAME)

build/templates/dev/domain.json:templates/dev/domain.js
	./bin/build.js dev/domain
build/templates/dev/bucket.json:templates/dev/bucket.js
	./bin/build.js dev/bucket
build/templates/dev/lex.json:templates/dev/lex.js
	./bin/build.js dev/lex
build/templates/dev/cognito.json:templates/dev/cognito.js
	./bin/build.js dev/cognito
build/templates/dev/es.json:templates/dev/es.js
	./bin/build.js dev/es
build/templates/dev/master.json:templates/dev/master.js
	./bin/build.js dev/master


