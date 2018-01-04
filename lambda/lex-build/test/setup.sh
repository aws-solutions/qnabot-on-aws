#! /bin/bash

echo "Checking for cloudformation dependencies"
cd ../../../
npm run stack dev/domain make-sure wait
npm run stack dev/lex make-sure wait

echo "test ready. run tests with:"
echo "  $(npm bin)/nodeunit index.js"
