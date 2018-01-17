#! /bin/bash

node ./setup.js
OUTPUT=$(ask api create-skill -f ./files/skill.json)
echo $OUTPUT
ID=$(echo "$OUTPUT" | grep amzn1.ask.skill | cut -d' '  -f3)

ask api update-model --skill-id $ID --file ./files/model.json --locale en-US --debug
