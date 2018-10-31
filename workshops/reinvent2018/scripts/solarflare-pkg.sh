#!/usr/bin/env bash

export S3Bucket=`aws cloudformation describe-stacks --stack-name solarflare-code-bucket --query "Stacks[0].Outputs[?OutputKey=='S3Bucket'].OutputValue" --no-paginate --output text`

sam package \
    --template-file ../templates/solarflare-master.yaml \
    --output-template-file ../templates/solarflare-packaged.yaml \
    --s3-bucket $S3Bucket

