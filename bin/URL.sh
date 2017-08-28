#! /bin/bash 

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT=$($__dirname/master-output.sh)
URL=$(echo $OUTPUT | jq --raw-output '.URL')

echo https://$URL
