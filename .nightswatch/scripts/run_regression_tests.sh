#!/bin/bash
######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                      			 #
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

set -e -x

cd ${NIGHTSWATCH_TEST_DIR}/

echo 'install pytest'
pip install -U pytest
pip install -r requirements.txt
echo 'echo requirements installed'

cd ${NIGHTSWATCH_TEST_DIR}/functional/

aws configure list

### Issue: Test are taking too long to run sequentially and tests fail when run in parallel when Selenium operating within the same browser instance.
### Action: So running functional test in one random regions 
REGIONS=($(${NIGHTSWATCH_TEST_DIR}/scripts/utils/listregions.py yaml-filename=taskcat.yml | tr -d "[],'"))
NUMBER_OF_REGIONS=${#REGIONS[@]}
RANDOM_NUM=$(( $RANDOM % $NUMBER_OF_REGIONS ))
echo "Regression test selected for region: ${REGIONS[RANDOM_NUM]}"

function runRegressionTest {
    export STACK_FILE_NAME=$1
    regex="(.*)-(${REGIONS[RANDOM_NUM]})-cfnlogs.txt"
    if [[ $STACK_FILE_NAME =~ $regex ]];
        then
            export CURRENT_STACK_NAME=${BASH_REMATCH[1]};
            export CURRENT_STACK_REGION=${BASH_REMATCH[2]};

            export RESULTS_FILE_NAME="${STACK_FILE_NAME/-cfnlogs.txt/-python-functional-logs.json}"
            cd ${NIGHTSWATCH_TEST_DIR}/functional/
            echo 'running for current stack region --- ' $CURRENT_STACK_REGION
            echo 'current stack --- ' $CURRENT_STACK_NAME
            echo $RESULTS_FILE_NAME
            pwd
            echo 'above is the location'

           (EMAIL='test@example.com' pytest -vs --json=${NIGHTSWATCH_TEST_DIR}/functional/results/$RESULTS_FILE_NAME) &

            sleep 120
    fi
}

# For each of the stack from taskcat_outputs/ folder, run the regression tests.
for file in ${NIGHTSWATCH_TEST_DIR}/*.txt
    do
        runRegressionTest ${file##*/}
    done
wait
