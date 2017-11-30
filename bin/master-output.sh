#! /bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

STACK=$($__dirname/name.sh master)

OUTPUTS=$(aws cloudformation describe-stacks --stack-name $STACK  | $(npm bin)/jq '.Stacks[0].Outputs')
node -e "var a={};var b=$OUTPUTS;b.forEach(x=>a[x.OutputKey]=x.OutputValue);console.log(JSON.stringify(a))"
