#!/bin/bash

######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################

[ "$DEBUG" == 'true' ] && set -x
set -e

run_javascript_lambda_test() {
	lambda_name=$1
	lambda_description=$2
	echo "------------------------------------------------------------------------------"
	echo "[Test] Javascript Lambda: $lambda_name, $lambda_description"
	echo "------------------------------------------------------------------------------"
	cd $source_dir/lambda/$lambda_name

	[ "${CLEAN:-true}" = "true" ] && npm run clean
	npm ci
	npm test
	if [ "$?" = "1" ]; then
		echo "(run-all-tests.sh) ERROR: there is likely output above." 1>&2
		exit 1
	fi
    [ "${CLEAN:-true}" = "true" ] && rm -rf coverage/lcov-report
}

# Save the current working directory and set source directory
source_dir=$PWD
cd $source_dir

# Option to clean or not clean the unit test environment before and after running tests.
# The environment variable CLEAN has default of 'true' and can be overwritten by caller
# by setting it to 'false'. Particularly,
#    $ CLEAN=false ./run-all-tests.sh
#
CLEAN="${CLEAN:-true}"

echo "Starting Lambda unit tests"

run_javascript_lambda_test connect "Connect Lambda Unit Tests"
run_javascript_lambda_test genesys "Genesys Lambda Unit Tests"
run_javascript_lambda_test js_lambda_hook_sdk "JS Lambda Hook SDK Unit Tests"
run_javascript_lambda_test qnabot-common-layer "QnaBot Common Layer Lambda Unit Tests"
run_javascript_lambda_test schema "Schema Lambda Unit Tests"
run_javascript_lambda_test translate "Translate Lambda Unit Tests"