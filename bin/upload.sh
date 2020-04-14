#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(require('$__dirname'+'/../config').profile)")
# If profile specified from config file does not exist, allow cli to move on to using instance profile
aws configure get aws_access_key_id --profile $AWS_PROFILE || unset AWS_PROFILE
export AWS_DEFAULT_REGION=$(node -e "console.log(require('$__dirname'+'/../config').region)")

OUTPUT=$($__dirname/exports.js dev/bootstrap)
BUCKET=$( echo $OUTPUT | $__dirname/json.js Bucket)
PREFIX=$( echo $OUTPUT | $__dirname/json.js Prefix)

BLUE=$(tput setaf 4)
RESET=$(tput sgr0)
echo bootstrap bucket is $BLUE$BUCKET/$PREFIX$RESET

aws s3 sync $__dirname/../build/ s3://$BUCKET/$PREFIX/ --delete  
