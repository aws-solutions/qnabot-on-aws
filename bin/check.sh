#! /bin/bash

TEMP=templates/$1

aws cloudformation validate-template        \
    --template-body file://$TEMP            \
    | $(npm bin)/jq
