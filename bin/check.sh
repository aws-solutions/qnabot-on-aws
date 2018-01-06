#! /bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")
BUCKET=$($__dirname/exports.js | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-BUCKET"')
PREFIX=$($__dirname/exports.js | $(npm bin)/jq --raw-output '."QNA-BOOTSTRAP-PREFIX"')
TEMPLATE=$1

instructions (){
    echo "Use this command to check syntax of stacks in bootstrap Bucket"
    echo ""
    echo "syntax:"
    echo "  npm run check {template} "
    echo "Where:"
    echo "  template= path of template relative to /build/templates"
}

run (){
    if [ "$BUCKET" = "null" ];then
        echo "Error, No Bootstrap Bucket. Ignore if you are just starting up the bootstrap bucket"
    else
        FILE="http://s3.amazonaws.com/$BUCKET/$PREFIX/templates/$TEMPLATE.json"
        echo "Checking Syntax of template at:"
        echo "  $FILE"
        echo ""
        OUT=$(aws cloudformation validate-template --template-url $FILE)
        RESULT=$?
        
        if [ $RESULT -eq 0 ]; then
            echo "Template is Valid"
        else
            echo "Invalid Template"
            echo $OUT | $(npm bin)/jq
        fi
    fi
}
if [ -n "$1" ];then
    run
else
    instructions
fi
