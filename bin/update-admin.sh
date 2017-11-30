#! /bin/bash 

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

OUTPUT=$($__dirname/master-output.sh)
DIR=$__dirname/../website/admin/build
BUCKET=$(echo $OUTPUT | $(npm bin)/jq --raw-output '.AdminBucket')

set -x
aws s3 cp $DIR s3://$BUCKET --recursive 
