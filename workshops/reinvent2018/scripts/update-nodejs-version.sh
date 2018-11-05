#!/usr/bin/env bash

. ~/.nvm/nvm.sh
nvm install 8.12.0
nvm alias default 8

npm uninstall -g aws-sam-local
pip install --user aws-sam-cli
pip install awscli --upgrade --user

USER_BASE_PATH=$(python -m site --user-base)
export PATH=$USER_BASE_PATH/bin:$PATH