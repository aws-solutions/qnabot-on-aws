#! /bin/bash 

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT=$($__dirname/exports.js)
BUCKET=$( echo $OUTPUT | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$( echo $OUTPUT | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-PREFIX"')

echo "Master"
echo "http://s3.amazonaws.com/$BUCKET/$PREFIX/templates/master.min.json"

echo "Public"
echo "http://s3.amazonaws.com/$BUCKET/$PREFIX/templates/public.min.json"
