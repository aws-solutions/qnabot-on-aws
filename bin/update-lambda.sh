#! /bin/bash 

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
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
