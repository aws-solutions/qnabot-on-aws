#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE=$__dirname/..
SELENIUM_START=/opt/bin/entry_point.sh
cd $BASE

if [ -e $SELENIUM_START ]; then
    $SELENIUM_START & 
fi
    
npm run --silent bootstrap

if [ $? -ne 0 ]; then
    echo "failed to create bootstrap bucket"
    exit 1
fi

mkdir -p $__dirname/output
rm $__dirname/output/*;

echo "ready"
