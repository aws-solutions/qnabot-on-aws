#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

STACK=$1
TEMP=build/templates/$STACK.json
NAME=$(echo $1 | rev | cut -d'/' -f1 | rev)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

name () {
    echo $($DIR/name.sh $STACK $1)
}

up(){ 
    ./bin/check.sh $STACK 
    aws cloudformation create-stack             \
        --stack-name $(name inc)                \
        --capabilities "CAPABILITY_NAMED_IAM"   \
        --disable-rollback                      \
        --template-body file://$TEMP
}

update(){ 
    ./bin/check.sh $STACK
    aws cloudformation update-stack             \
        --stack-name $(name)                    \
        --capabilities "CAPABILITY_NAMED_IAM"   \
        --template-body file://$TEMP
}

down(){ 
    aws cloudformation delete-stack --stack-name $(name)
}

case $2 in 
    "update")
        update
        ;;
    "up") 
        up
        ;;
    "down")
        down
        ;;
    "restart")
        down
        up
        ;;
    *)
        echo "unkown"
        ;;
esac

        

