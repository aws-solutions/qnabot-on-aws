#!/usr/bin/env bash

sudo npm uninstall -g aws-sam-local
sudo pip install --upgrade pip
pip --version
pip install --user aws-sam-cli
pip install awscli --upgrade --user

nvm install 8.12.0
nvm alias default 8
source ~/.nvm/nvm.sh

USER_BASE_PATH=$(python -m site --user-base)
export PATH=$USER_BASE_PATH/bin:$PATH

source ~/.nvm/nvm.sh

node --version
nvm --version

echo $PATH
