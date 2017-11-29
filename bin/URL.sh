#! /bin/bash 

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT=$($__dirname/exports.js)
BUCKET=$( echo $OUTPUT | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$( echo $OUTPUT | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-PREFIX"')
REGION='us-east-1'

MASTER="http://s3.amazonaws.com/$BUCKET/$PREFIX/templates/master.min.json"
PUBLIC="http://s3.amazonaws.com/$BUCKET/$PREFIX/templates/public.min.json"

echo "========================Master=============="
echo "$MASTER"
echo ""
echo "https://console.aws.amazon.com/cloudformation/home?region=$REGION#/stacks/new?stackName=QnABot&templateURL=$MASTER"

echo "========================Public=============="
echo "$PUBLIC"
echo ""
echo "https://console.aws.amazon.com/cloudformation/home?region=$REGION#/stacks/new?stackName=QnABot&templateURL=$PUBLIC"

