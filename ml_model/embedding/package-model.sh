#!/bin/bash
# download and package 
USAGE="$0 <target model tar.gz file>"
REPO="https://huggingface.co/intfloat/e5-large"

DST=$1
[ -z "$DST" ] && echo "Target tar.gz file path/name is a required parameter. Usage $USAGE" && exit 1

mkdir -p `dirname $DST`
if [ -d ./model_repo ]; then
    pushd ./model_repo && git pull && popd
else
    echo "Installing and initializing git-lfs"
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.rpm.sh | sudo bash
    sudo yum install git-lfs git -y
    git lfs install
    echo "Cloning repo: $REPO"
    git clone $REPO ./model_repo 
    echo "Customize inference code for embedding model"
    # see https://github.com/huggingface/notebooks/blob/main/sagemaker/17_custom_inference_script/sagemaker-notebook.ipynb
    mkdir -p ./model_repo/code
    cp ./inference.py ./model_repo/code/inference.py
fi
echo "Creating model archive file: $DST (please be patient - this takes several minutes)"
tar zcvf $DST --exclude='./.git' -C ./model_repo .
