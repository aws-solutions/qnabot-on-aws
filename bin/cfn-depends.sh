#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Checking for cloudformation dependencies"
cd $__dirname
for arg;do
    npm run --silent stack $arg make-sure  -- --no-interactive --verbose & 
done

wait

