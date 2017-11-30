#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

OUTPUT=$($__dirname/exports.js)
DEVBUCKET=$(echo $OUTPUT | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')

PUBLICBUCKET=$(node -e "console.log(JSON.stringify(require('./config')))" | $(npm bin)/jq --raw-output '.publicBucket')
PUBLICPREFIX=$(node -e "console.log(JSON.stringify(require('./config')))" | $(npm bin)/jq --raw-output '.publicPrefix')

if [ "$1" == "dryrun" ]; then
    echo "dry run"
    aws s3 cp s3://$DEVBUCKET/$PUBLICPREFIX s3://$PUBLICBUCKET/$PUBLICPREFIX --recursive --dryrun --acl public-read
else
    aws s3 cp s3://$DEVBUCKET/$PUBLICPREFIX s3://$PUBLICBUCKET/$PUBLICPREFIX --recursive --acl public-read
fi

echo https://s3.amazonaws.com/$PUBLICBUCKET/$PUBLICPREFIX/templates/master.json
