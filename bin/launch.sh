#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

instructions (){
    echo "Use this command to managed stacks"
    echo ""
    echo "syntax:"
    echo "  npm run stack {template} {op}"
    echo "Where:"
    echo "  template= path of template relative to /build/templates"
    echo "  op= up|update|down|restart"
    echo "Options"
    echo "  -v|--verbose Increase debug output"
    echo "  -d|--dry-run Run command but do not create any resources"
    echo "  -h|--help show this "
    echo "  --no-check do not check template syntax"
    echo "  --no-wait do not wait for stack operation to complete"
    echo "  --no-interactive no not show spinners"
}

STACK=$1
OP=$2
WAIT=true
VERBOSE=false
INTERACTIVE=false
RUN=true
CHECK=true
shift; shift 
for i in "$@"; do
    case "$i" in
        -v|--verbose)
            VERBOSE=true
            shift;
            ;;
        -d|--dry-run)
            RUN=false
            shift;
            ;;
        -h|--help)
            instructions
            exit 0
            ;;
        --no-check)
            CHECK=false
            ;;
        --no-wait)
            WAIT=false
            ;;
        --no-interactive)
            interactive=false
            ;;
        --) shift; break;;
    esac
done
function wait(){
    if [ "$WAIT" == true ] && [ "$RUN" == true ]; then
        case $INTERACTIVE in
            true) SHOW=show ;;
            false) SHOW=noshow  ;;
        esac
        $__dirname/wait.js $(name) $SHOW
    fi
}
function execute(){
    if [ "$VERBOSE" == true ]; then
        echo "COMMAND: ${@}" | tr -s " "
    fi

    if [ "$RUN" == true ]; then
        ID=$(eval "$@" | $(npm bin)/jq --raw-output ".StackId")
        echo "Stack Id:$ID"
        wait 
    fi
}

TEMP=$__dirname/../build/templates/$STACK.json
NAME=$(echo $STACK | rev | cut -d'/' -f1 | rev)

name () {
    echo $($__dirname/name.sh $STACK $1)
}

up(){
    if [ "$CHECK" == true ]; then
        $__dirname/check.sh $STACK
    fi
    execute "aws cloudformation create-stack    \
        --stack-name $(name inc)                \
        --capabilities \"CAPABILITY_NAMED_IAM\" \
        --disable-rollback                      \
        --template-body file://$TEMP    " 
}

make-sure (){
    EXISTS=$()
    RESULT=$?
    if aws cloudformation describe-stacks --stack-name $(name) > /dev/null 2>&1; then
        echo "$(name) exists"
        wait
    else 
        echo "$(name) does not exist, creating now"
        up
    fi
}

update(){ 
    if [ "$CHECK" == true ]; then
        $__dirname/check.sh $STACK
    fi
    execute "aws cloudformation update-stack        \
        --stack-name $(name)                        \
        --capabilities \"CAPABILITY_NAMED_IAM\"     \
        --template-body file://$TEMP        " 
}

down(){ 
    execute "aws cloudformation delete-stack --stack-name $(name)"
}

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
        TMP=$WAIT
        WAIT=false
        down
        WAIT=$TMP
        up
        ;;
    "make-sure")
        make-sure
        ;;
    *)
        instructions
        ;;
esac

        

