#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name solution-name version-code
#
# Parameters:
#  - source-bucket-base-name: Name for the S3 bucket location where the template will source the Lambda
#    code from. The template will append '-[region_name]' to this bucket name.
#    For example: ./build-s3-dist.sh my-bucket-base my-solution v1.0.0
#    The template will then expect the source code to be located in the solutions-[region_name] bucket
#  - solution-name: name of the solution for consistency
#  - version-code: version of the package

[ "$DEBUG" == 'true' ] && set -x
set -e

sedi()
{
    # cross-platform for sed -i
    sed -i $* 2>/dev/null || sed -i "" $*
}

# use sed to perform token replacement
# ex. do_replace myfile.json %%VERSION%% v1.1.1
do_replace()
{
    replace="s/$2/$3/g"
    file=$1
    sedi $replace $file
}

# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Please provide the base source bucket name, trademarked solution name, and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions trademarked-solution-name v1.0.0"
    exit 1
fi

# Get reference for all important folders
template_dir="$PWD"
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
source_dir="$template_dir/../"

# Grabbing input parameters
bucket_name="$1"
solution_name="$2"
version="$3"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean old dist and node_modules folders"
echo "------------------------------------------------------------------------------"
echo rm -rf $template_dist_dir
rm -rf $template_dist_dir
echo rm -rf $build_dist_dir
rm -rf $build_dist_dir
echo "mkdir -p $template_dist_dir"
mkdir -p "$template_dist_dir"
echo "mkdir -p $build_dist_dir"
mkdir -p "$build_dist_dir"

echo "------------------------------------------------------------------------------"
echo "[Init] Install dependencies and build"
echo "------------------------------------------------------------------------------"
cd $source_dir

# workaround for Config file confusing make and node import of "config.js"
# renaming Config temporarily
if [[ -f "Config" ]]; then
    mv Config Config_renamed
fi

npm install

npm run configAwsSolutions

do_replace "config.json" %%BUCKET_NAME%% $bucket_name
do_replace "config.json" %%SOLUTION_NAME%% $solution_name
do_replace "config.json" %%VERSION%% $version

npm run build

# workaround for Config file confusing make and node import of "config.js"
# by renaming back to Config
if [[ -f "Config_renamed" ]]; then
    mv Config_renamed Config
fi

echo "------------------------------------------------------------------------------"
echo "[Init] Copying templates to global-s3-assets/"
echo "------------------------------------------------------------------------------"

cp build/templates/public.json $template_dist_dir/aws-qnabot-main.template
cp build/templates/public-vpc-support.json $template_dist_dir/aws-qnabot-vpc.template
cp build/templates/master.json $template_dist_dir/aws-qnabot-extended.template

echo "------------------------------------------------------------------------------"
echo "[Init] Copying lambda assets to regional-s3-assets/"
echo "------------------------------------------------------------------------------"

mkdir -p $build_dist_dir/lambda
cp build/lambda/*.zip $build_dist_dir/lambda/
cp build/*.zip $build_dist_dir/

# put a copy of all templates in the regional buckets, especially useful
# for the nested templates
mkdir -p $build_dist_dir/templates
cp build/templates/*.json $build_dist_dir/templates/
