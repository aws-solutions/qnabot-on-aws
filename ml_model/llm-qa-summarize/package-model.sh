#!/bin/bash
# download and package
USAGE="$0 <target model tar.gz file>"
REPO="https://huggingface.co/philschmid/flan-t5-xxl-sharded-fp16"

DST=$1
[ -z "$DST" ] && echo "Target tar.gz file path/name is a required parameter. Usage $USAGE" && exit 1

mkdir -p `dirname $DST`
if [ -d ./model_repo ]; then
    pushd ./model_repo && git pull && popd
else
    echo "Cloning repo: $REPO"
    git clone $REPO ./model_repo
    echo "Customize inference code for model"
    # see https://www.philschmid.de/deploy-flan-t5-sagemaker
    mkdir -p ./model_repo/code
    cp ./inference.py ./model_repo/code/inference.py
    cp ./requirements.txt ./model_repo/code/requirements.txt
fi
echo "Creating model archive file: $DST (please be patient - this takes several minutes)"
tar zcvf $DST --exclude='./.git' -C ./model_repo .
