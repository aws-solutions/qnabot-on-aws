#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(require('$__dirname'+'/../config').profile)")
export AWS_DEFAULT_REGION=$(node -e "console.log(require('$__dirname'+'/../config').region)")

OUTPUT=$($__dirname/exports.js dev/bootstrap)
DEVBUCKET=$( echo $OUTPUT | $__dirname/json.js Bucket)
PREFIX=$( echo $OUTPUT | $__dirname/json.js Prefix)
REGION=$AWS_DEFAULT_REGION


PUBLICBUCKET=$(node -e "console.log(require('$__dirname'+'/../config').publicBucket)")
PUBLICPREFIX=$(node -e "console.log(require('$__dirname'+'/../config').publicPrefix)")

if [ "$1" == "--dryrun" ]; then
    echo "dry run"
    aws s3 cp s3://$DEVBUCKET/$PUBLICPREFIX s3://$PUBLICBUCKET/$PUBLICPREFIX --recursive --dryrun --acl public-read
fi

if [ "$1" == "--run" ]; then
    aws s3 cp s3://$DEVBUCKET/$PUBLICPREFIX s3://$PUBLICBUCKET/$PUBLICPREFIX --recursive --acl public-read
fi

echo https://s3.amazonaws.com/$PUBLICBUCKET/$PUBLICPREFIX/templates/master.json
