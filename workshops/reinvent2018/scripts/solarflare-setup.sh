#!/usr/bin/env bash
aws cloudformation deploy --template-file ../templates/solarflare-code-bucket.yaml --stack-name solarflare-code-bucket

# get S3 bucket location and https based url
echo $'\nS3 Bucket: '; aws cloudformation describe-stacks --stack-name solarflare-code-bucket --query "Stacks[0].Outputs[?OutputKey=='S3Bucket'].OutputValue" --no-paginate --output text

