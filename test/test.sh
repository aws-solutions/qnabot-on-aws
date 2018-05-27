#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE=$__dirname/..
cd $BASE

#npm run up

echo "Testing Api/Lex"
if $__dirname/run.js $BASE/templates/master/test/index.js master; then
    echo "Finished Testing API/Lex"
else
    exit 1
fi


