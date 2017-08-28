#! /bin/bash 

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT=$($__dirname/master-output.sh)
DIR=$__dirname/../website/admin/build
BUCKET=$(echo $OUTPUT | jq --raw-output '.AdminBucket')

set -x
aws s3 cp $DIR s3://$BUCKET --recursive 
