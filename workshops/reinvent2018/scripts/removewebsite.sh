#!/usr/bin/env bash
export S3Bucket=`aws cloudformation describe-stacks --stack-name qnabotworkshop-website --query "Stacks[0].Outputs[?OutputKey=='S3Bucket'].OutputValue" --no-paginate --output text`
aws s3 rm s3://$S3Bucket/index.html
aws s3 rm s3://$S3Bucket/solar.png
aws cloudformation delete-stack --stack-name qnabotworkshop-website
