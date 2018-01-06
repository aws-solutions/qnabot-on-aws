#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

NAME=$(echo $1 | rev | cut -d'/' -f1 | rev)
TYPE=$(echo $1 | rev | cut -d'/' -f2 | rev)

if [ "$NAME" = "$TYPE" ]; then
    FULL=$NAME
else 
    FULL=$TYPE-$NAME
fi

if [ ! -e $__dirname/.inc ];then
    echo "{}" > $__dirname/.inc 
fi

INC=$(cat $__dirname/.inc)
VALUE=$(echo $INC | $(npm bin)/jq --raw-output ".\"$NAME\"")

if [ "$VALUE" = "null" ];then
    VALUE=0
fi

if [ ! -z $2 ];then
    VALUE=$(($VALUE+1))
    NEW=$(echo $INC | $(npm bin)/jq ".\"$NAME\"=$VALUE")
    echo $NEW > $__dirname/.inc
fi

echo QNA-$FULL-$VALUE
