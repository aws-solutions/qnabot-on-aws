#! /bin/bash

echo "Checking for cloudformation dependencies"
cd ../../../
npm run stack dev/domain make-sure 
npm run stack dev/cognito make-sure 
npm run stack dev/bucket make-sure 

echo "test ready. run tests with:"
echo "  $(npm bin)/nodeunit index.js"
