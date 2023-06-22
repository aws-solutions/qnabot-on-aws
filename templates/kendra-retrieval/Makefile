NAME=$(shell basename $(shell pwd))
DST=../../build/templates/$(NAME).yaml
RESOURCES := $(shell  find . )

$(DST): $(RESOURCES)
	echo "Building $(NAME)"; cp -f template.yaml $(DST)
