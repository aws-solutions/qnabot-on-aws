#! /bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STACK=$($__dirname/name.sh master)

OUTPUTS=$(aws cloudformation describe-stacks --stack-name $STACK  | jq '.Stacks[0].Outputs')
node -e "var a={};var b=$OUTPUTS;b.forEach(x=>a[x.OutputKey]=x.OutputValue);console.log(JSON.stringify(a))"
