#! /bin/bash 

export DSTBUCKET=$(../../../bin/exports.js |jq  --raw-output '."QNA-DEV-BUCKET"')
export SRCBUCKET=$(../../../bin/exports.js |jq  --raw-output '."QNA-BOOTSTRAP-BUCKET"')

echo bucket:$SRCBUCKET
echo bucket:$DSTBUCKET
$(npm bin)/nodeunit ./test.js 
