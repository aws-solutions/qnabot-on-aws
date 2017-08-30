#! /bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

BUCKET=$(./bin/exports.js | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$(node -e "console.log(JSON.stringify(require('./config')))" | $(npm bin)/jq --raw-output '."publicPrefix"')
BLUE=$(tput setaf 4)
RESET=$(tput sgr0)
echo bootstrap bucket is $BLUE$BUCKET/$PREFIX$RESET

cfn(){
    aws s3 sync ./templates s3://$BUCKET/$PREFIX/templates/    \
        --exclude '*'       \
        --delete            \
        --include '*.json'  
}

cfn &
for LAMBDA in $DIR/../lambda/*;do
    $DIR/lambda.sh $(basename $LAMBDA) &
done

wait
