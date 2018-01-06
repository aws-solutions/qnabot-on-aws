#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
$__dirname/../../../bin/cfn-depends.sh dev/master

cd $__dirname/.. & make test

