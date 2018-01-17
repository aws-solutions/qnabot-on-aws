#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE=$__dirname/..
cd $BASE

npm run --silent bootstrap

if [ $? -ne 0 ]; then
    echo "failed to create bootstrap bucket"
    exit 1
fi

mkdir -p $__dirname/output
rm $__dirname/output/*;

echo "ready"
