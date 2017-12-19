#! /bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")
BUCKET=$($__dirname/exports.js | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$($__dirname/exports.js | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-PREFIX"')


aws cloudformation validate-template                \
    --template-url http://s3.amazonaws.com/$BUCKET/$PREFIX/templates/$1.json \
    | $(npm bin)/jq
