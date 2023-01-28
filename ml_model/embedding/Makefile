DST=../../build/ml_model/e5-large.tar.gz
RESOURCES := $(shell  find . )

$(DST): $(RESOURCES)
	echo "Building $(NAME)"; sh ./package-model.sh $(DST)
