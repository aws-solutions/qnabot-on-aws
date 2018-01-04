#! /bin/bash 

cd ..
region=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | $(npm bin)/jq --raw-output ".region" )
PROFILE="test"

if [ ! -f ./config.json ]; then 
    node config.js.example john@example.com $region > config.json
    cat config.json > tmp.json
    cat tmp.json | jq '.profile=\"$PROFILE\"' > config.json
    rm tmp.json
fi

echo "configuring aws cli"
role_name=$( curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/ )
if [ -z "$role_name" ]; then
    echo "please attach role to ec2 instance"
    exit 1
fi
creds=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/${role_name})

aws configure set aws_access_key_id $( echo $creds | $(npm bin)/jq --raw-output ".AccessKeyId")
aws configure set aws_secret_access_key $( echo $creds | $(npm bin)/jq --raw-output ".SecretAccessKey")
aws configure set aws_session_token $( echo $creds | $(npm bin)/jq --raw-output ".Token")
aws configure set $PROFILE.region $region

make templates
npm run stack dev/bootstrap up w

if [ $? -ne 0 ]; then
    echo "failed to create bootstrap bucket"
    exit 1
fi
npm run upload

npm run stack dev/master up w

if [ $? -ne 0 ]; then
    echo "failed to launch master stack"
    exit 1
fi

./templates/api/unit/setup.sh
$(npm bin)/nodeunit templates/api/unit 
$(npm bin)/nodeunit website/test

./lambda/cfn/test/setup.sh
./lambda/fulfillment/test/setup.sh
./lambda/import/test/setup.sh
./lambda/lex-build/test/setup.sh

$(npm bin)/nodeunit ./lambda/test.js
