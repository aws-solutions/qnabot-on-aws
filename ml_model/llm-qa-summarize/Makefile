DST=../../build/ml_model/flan-t5-xxl-sharded-fp16.tar.gz
RESOURCES := $(shell  find . )

$(DST): $(RESOURCES)
	echo "Building $(NAME)"; sh ./package-model.sh $(DST)
