#!/usr/bin/env bash
aws cloudformation deploy --template-file ../templates/website.yaml --stack-name qnabotworkshop-website

# get S3 bucket location and https based url
echo $'\nS3 Bucket: '; aws cloudformation describe-stacks --stack-name qnabotworkshop-website --query "Stacks[0].Outputs[?OutputKey=='S3Bucket'].OutputValue" --no-paginate --output text
export S3Bucket=`aws cloudformation describe-stacks --stack-name qnabotworkshop-website --query "Stacks[0].Outputs[?OutputKey=='S3Bucket'].OutputValue" --no-paginate --output text`
export S3URL=`aws cloudformation describe-stacks --stack-name qnabotworkshop-website --query "Stacks[0].Outputs[?OutputKey=='S3BucketSecureURL'].OutputValue" --no-paginate --output text`
echo $'\nWebsite Url:'
echo $S3URL/index.html
echo

# copy in the content to the S3 bucket with public read access
aws s3 cp ../web/index.html s3://$S3Bucket/index.html --acl public-read
aws s3 cp ../web/solar.png s3://$S3Bucket/solar.png --acl public-read