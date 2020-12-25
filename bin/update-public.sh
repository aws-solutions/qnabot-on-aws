#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(require('$__dirname'+'/../config').profile)")
# If profile specified from config file does not exist, allow cli to move on to using instance profile
aws configure get aws_access_key_id --profile $AWS_PROFILE || unset AWS_PROFILE
export AWS_DEFAULT_REGION=$(node -e "console.log(require('$__dirname'+'/../config').region)")

OUTPUT=$($__dirname/exports.js dev/bootstrap)
DEVBUCKET=$( echo $OUTPUT | $__dirname/json.js Bucket)
PREFIX=$( echo $OUTPUT | $__dirname/json.js Prefix)
REGION=$AWS_DEFAULT_REGION

echo $DEVBUCKET

PUBLICBUCKET=$(node -e "console.log(require('$__dirname'+'/../config').publicBucket)")
PUBLICPREFIX=$(node -e "console.log(require('$__dirname'+'/../config').publicPrefix)")

if [ "$1" == "--dryrun" ]; then
    echo "dry run"
    aws s3 cp s3://$DEVBUCKET/$PREFIX s3://$PUBLICBUCKET/$PUBLICPREFIX --recursive --dryrun --acl public-read
fi

if [ "$1" == "--run" ]; then
    npm run upload
    aws s3 cp s3://$DEVBUCKET/$PREFIX s3://$PUBLICBUCKET/$PUBLICPREFIX --recursive --acl public-read
    $__dirname/URL.sh
fi

echo https://$PUBLICBUCKET.s3.$REGION.amazonaws.com/$PUBLICPREFIX/templates/master.json
echo https://$PUBLICBUCKET.s3.$REGION.amazonaws.com/$PUBLICPREFIX/templates/public.json
echo https://$PUBLICBUCKET.s3.$REGION.amazonaws.com/$PUBLICPREFIX/templates/public-vpc-support.json
