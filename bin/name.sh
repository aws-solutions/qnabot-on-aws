#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export AWS_PROFILE=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".profile")
export AWS_DEFAULT_REGION=$(node -e "console.log(JSON.stringify(require('$__dirname'+'/../config')))" | $(npm bin)/jq --raw-output ".region")

NAME=$(echo $1 | rev | cut -d'/' -f1 | rev)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ ! -e $DIR/.inc ];then
    echo "{}" > $DIR/.inc 
fi

INC=$(cat $DIR/.inc)
VALUE=$(echo $INC | $(npm bin)/jq --raw-output ".\"$NAME\"")

if [ "$VALUE" = "null" ];then
    VALUE=0
fi

if [ ! -z $2 ];then
    VALUE=$(($VALUE+1))
    NEW=$(echo $INC | $(npm bin)/jq ".\"$NAME\"=$VALUE")
    echo $NEW > $DIR/.inc
fi

echo QNA-$NAME-$VALUE

