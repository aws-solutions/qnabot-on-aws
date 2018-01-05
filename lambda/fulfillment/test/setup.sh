#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Checking for cloudformation dependencies"
cd $__dirname/../../../
npm run --silent stack dev/domain make-sure 

echo "test ready. run tests with:"
echo "  cd $__dirname & $(npm bin)/nodeunit index.js"
