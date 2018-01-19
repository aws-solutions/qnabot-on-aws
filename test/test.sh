#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE=$__dirname/..
cd $BASE

echo "Testing Website"
make -C $BASE/website test
cd $BASE
if $__dirname/run.js $BASE/website/test/index.js website; then
    echo "Finished Testing Website"
else
    exit 1
fi
echo "Testing Lambdas"
if $__dirname/run.js $BASE/lambda/test.js lambdas; then
    echo "Finished Testing Lambdas"
else
    exit 1
fi
echo "Testing Api/Lex"
if $__dirname/run.js $BASE/templates/api/unit/index.js master; then
    echo "Finished Testing Website"
else
    exit 1
fi

npm run up

