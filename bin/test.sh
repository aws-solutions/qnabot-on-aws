#! /bin/bash 

cd ..
region=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | $(npm bin)/jq --raw-output ".region" )
if [ ! -f ./config.js ]; then 
    node config.js.example john@example.com $region > config.json
fi
npm run bootstrap
if $(aws s3 ls); then
    echo "aws cli configured"
else
    echo "configureing aws cli"
    role_name=$( curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/ )
    if [ -z "$role_name" ]; then
        echo "please attach role to ec2 instance"
    fi
    creds=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/${role_name})
    
    profile=$(cat config.json | $(npm bin)/jq --raw-output ".profile")
    
    aws configure set aws_access_key_id $( echo $creds | $(npm bin)/jq --raw-output ".AccessKeyId")
    aws configure set aws_secret_access_key $( echo $creds | $(npm bin)/jq --raw-output ".SecretAccessKey")
    aws configure set aws_session_token $( echo $creds | $(npm bin)/jq --raw-output ".Token")
    aws configure set $profile.region $region
fi

npm run stack dev/bootstrap up w

npm run stack dev/api up w &&
npm run stack dev/bucket up w &&
npm run stack dev/cfn up w &&
npm run stack dev/cognito up w &&
npm run stack dev/domain up w &&
npm run stack dev/lambda up w &&
npm run stack dev/lex up w &&
wait

$(npm bin)/nodeunit lambda/test

npm run stack dev/master up w

$(npm bin)/nodeunit templates/api/unit 
$(npm bin)/nodeunit website/test
