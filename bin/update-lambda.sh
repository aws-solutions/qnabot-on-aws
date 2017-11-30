#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

OUTPUT=$($__dirname/master-output.sh)
ZIP=fileb://$__dirname/../build/lambda/handler.zip

set -x

update(){
    echo "updating $1"
    aws lambda update-function-code     \
        --function-name $(echo $OUTPUT | $(npm bin)/jq --raw-output ".$1Arn") \
        --zip-file $ZIP
}

update Handler &

wait
