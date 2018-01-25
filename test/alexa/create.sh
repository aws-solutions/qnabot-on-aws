#! /bin/bash
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node $__dirname/setup.js
BIN=$(npm bin)
OUTPUT=$($BIN/ask api create-skill -f $__dirname/files/skill.json)
echo $OUTPUT
ID=$(echo "$OUTPUT" | grep amzn1.ask.skill | cut -d' '  -f3)

$BIN/ask api update-model --skill-id $ID \
    --file $__dirname/files/model.json \
    --locale en-US --debug
