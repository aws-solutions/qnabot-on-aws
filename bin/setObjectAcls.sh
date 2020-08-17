#! /bin/bash
FOLDER=$1
aws s3api put-object-acl --bucket aws-bigdata-blog  --acl bucket-owner-full-control --key artifacts/$FOLDER
for KEY in $(cat keys.txt); do
  target=$(eval echo $KEY)
  echo $target
  ## aws s3api put-object-acl --bucket aws-bigdata-blog  --acl public-read --key $target
  ## aws s3api put-object-acl --bucket aws-bigdata-blog  --acl bucket-owner-full-control --key $target
done
