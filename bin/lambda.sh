#! /bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

BUCKET=$($DIR/exports.js | jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$(node -e "console.log(JSON.stringify(require('./config')))" | jq --raw-output '."publicPrefix"')
BLUE=$(tput setaf 4)
RESET=$(tput sgr0)
TMP=$DIR/../build

echo bootstrap bucket is $BLUE$BUCKET/$PREFIX/$RESET
echo function $BLUE$1$RESET

cd $DIR/../lambda/$1 && zip -r -q $TMP/lambda/$1.zip .
