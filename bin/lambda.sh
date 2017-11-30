#! /bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

BUCKET=$($DIR/exports.js | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$(node -e "console.log(JSON.stringify(require('./config')))" | $(npm bin)/jq --raw-output '."publicPrefix"')
BLUE=$(tput setaf 4)
RESET=$(tput sgr0)
TMP=$DIR/../build

echo bootstrap bucket is $BLUE$BUCKET/$PREFIX/$RESET
echo function $BLUE$1$RESET

cd $DIR/../lambda/$1 && zip -r -q $TMP/lambda/$1.zip .
