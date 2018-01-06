#! /bin/bash 
__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE=$__dirname/..
cd $BASE

PROFILE="default"

if aws s3 ls --profile $PROFILE >> /dev/null; then
    echo "aws cli configured"
else
    echo "configuring aws cli"
    region=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | $(npm bin)/jq --raw-output ".region" )
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
fi
aws configure list --profile $PROFILE

if [ ! -f ./config.json ]; then 
    CLI_REGION=$(aws configure get region --profile $PROFILE)
    echo "creating config"

    node $BASE/config.js.example john@example.com $CLI_REGION > $BASE/config.json
    cat $BASE/config.json > $BASE/tmp.json
    cat $BASE/tmp.json | jq '.profile=\"$PROFILE\"' > $BASE/config.json
    rm $BASE/tmp.json
fi

cd $BASE & make templates
npm run --silent stack dev/bootstrap make-sure

if [ $? -ne 0 ]; then
    echo "failed to create bootstrap bucket"
    exit 1
fi
npm run --silent upload

$BASE/templates/api/unit/setup.sh       
$BASE/lambda/cfn/test/setup.sh           
$BASE/lambda/fulfillment/test/setup.sh  
$BASE/lambda/import/test/setup.sh       
$BASE/lambda/lex-build/test/setup.sh    
$BASE/lambda/proxy-es/test/setup.sh     
$BASE/website/test/setup.sh

x=0
rm $__dirname/debug.log

while [ $x -le 4 ]; do
    echo "Run Number:$x"
    echo "Testing Website"
    if $__dirname/run-test.js $BASE/website/test/index.js; then
        echo "Finished Testing Website"
    else
        exit 1
    fi
    echo "Testing Lambdas"
    if $__dirname/run-test.js $BASE/lambda/test.js; then
        echo "Finished Testing Website"
    else
        exit 1
    fi
    echo "Testing Api/Lex"
    if $__dirname/run-test.js $BASE/templates/api/unit/index.js; then
        echo "Finished Testing Website"
    else
        exit 1
    fi
    x=$(( $x - 1 ))
done


