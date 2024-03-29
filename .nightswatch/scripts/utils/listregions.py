#!/usr/bin/env python3
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

import os
import yaml
import sys

NIGHTSWATCH_TEST_DIR = os.getenv('NIGHTSWATCH_TEST_DIR')

def listregions(yaml_filename=None):
    if not yaml_filename:
        yaml_filename = 'taskcat.yml'
    with open(f'{NIGHTSWATCH_TEST_DIR}/deployment/{yaml_filename}', "r") as taskcat_file:
        output = yaml.safe_load(taskcat_file)
        project_details = output["project"]
        if "regions" in output["project"]:
            print(project_details["regions"])
            return project_details["regions"]
        else:
            testcase = output["tests"]
            myregions = []
            for tc in testcase:
                for region in testcase[tc]["regions"]:
                    myregions.append(region)
            print(myregions)
            return myregions

def invalid_usage():
    error_message = """ Invalid Usage ::
    Follow the example below
    listregions.py
    OR
    listregions.py yaml-filename='taskcat1.yml'
    """
    raise error_message

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        listregions()
    else:
        kwargs = dict(x.split('=', 1) for x in args)
        if not ('yaml-filename' in kwargs):
            invalid_usage()
        else:
            listregions(kwargs['yaml-filename'])