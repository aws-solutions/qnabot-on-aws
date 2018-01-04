#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

STACK=$1
OP=$2
WAIT=$3
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
        --template-body file://$TEMP            \
    | $(npm bin)/jq --raw-output ".StackId"     

    if [ -n "$WAIT" ]; then
        $DIR/wait.js $(name) 
    fi
}

make-sure (){
    EXISTS=$()
    RESULT=$?
    if aws cloudformation describe-stacks --stack-name $(name) > /dev/null; then
        echo "$(name) exists"
        exit 0
    else 
        echo "$(name) does not exists, creating now"
        up
    fi
}

update(){ 
    ./bin/check.sh $STACK
    aws cloudformation update-stack             \
        --stack-name $(name)                    \
        --capabilities "CAPABILITY_NAMED_IAM"   \
        --template-body file://$TEMP            \
    | $(npm bin)/jq --raw-output ".StackId"     
    
    if [ -n "$WAIT" ]; then
        $DIR/wait.js $(name) 
    fi
}

down(){ 
    aws cloudformation delete-stack --stack-name $(name)    \
    | $(npm bin)/jq --raw-output ".StackId"     
}
instructions (){
    echo "Use this command to managed stacks"
    echo ""
    echo "syntax:"
    echo "  npm run stack {template} {op} {wait}"
    echo "Where:"
    echo "  template= path of template relative to /build/templates"
    echo "  op= up|update|down|restart"
    echo "  wait= optional param to wait for action to complete"
}

if [ "$STACK" == "--help" ]; then
    instructions
fi

case $OP in 
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
    "make-sure")
        make-sure
        ;;
    *)
        instructions
        ;;
esac

        

