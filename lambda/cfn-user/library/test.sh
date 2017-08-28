#! /bin/bash 

export POOLID=$(../../../bin/exports.js |jq  --raw-output '."QNA-DEV-HANDLER-IDPOOL"')
export CLIENT=$(../../../bin/exports.js |jq  --raw-output '."QNA-DEV-HANDLER-CLIENT"')
export USERPOOL=$(../../../bin/exports.js |jq  --raw-output '."QNA-DEV-HANDLER-USERPOOL"')
echo PoolId:$POOLID
echo client:$CLIENT
echo userpool:$USERPOOL
$(npm bin)/nodeunit ./test.js 
