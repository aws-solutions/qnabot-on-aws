#!/usr/bin/env bash
sam deploy \
    --template-file ../templates/solarflare-packaged.yaml \
    --stack-name qna-workshop-solarflare \
    --capabilities CAPABILITY_IAM

aws cloudformation describe-stacks \
    --stack-name qna-workshop-solarflare \
    --query 'Stacks[].Outputs'
