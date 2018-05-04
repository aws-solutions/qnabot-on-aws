#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(require('$__dirname'+'/../config').profile)")
export AWS_DEFAULT_REGION=$(node -e "console.log(require('$__dirname'+'/../config').region)")

OUTPUT=$($__dirname/exports.js dev/bootstrap)
BUCKET=$( echo $OUTPUT | $__dirname/json.js Bucket)
PREFIX=$( echo $OUTPUT | $__dirname/json.js Prefix)
PUBLIC_BUCKET=$( cat $__dirname/../config.json | $__dirname/json.js publicBucket)
PUBLIC_PREFIX=$( cat $__dirname/../config.json | $__dirname/json.js publicPrefix)
REGION=$AWS_DEFAULT_REGION

MASTER="http://s3.amazonaws.com/$BUCKET/$PREFIX/templates/master.json"
PUBLIC="http://s3.amazonaws.com/$PUBLIC_BUCKET/$PUBLIC_PREFIX/templates/public.json"

echo "========================Master=============="
echo "template url:"
echo "$MASTER"
echo ""
echo "console launch url:"
echo "https://console.aws.amazon.com/cloudformation/home?region=$REGION#/stacks/new?stackName=QnABot&templateURL=$MASTER"
echo ""
echo ""
echo "========================Public=============="
echo "template url:"
echo "$PUBLIC"
echo ""
echo "console launch url:"
echo "https://console.aws.amazon.com/cloudformation/home?region=$REGION#/stacks/new?stackName=QnABot&templateURL=$PUBLIC"

