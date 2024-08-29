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
import logging

import pytest
from moto import mock_aws

from aws_solutions.core import get_service_client

logger = logging.getLogger(__name__)


def get_body():
    file_name = os.path.join(os.path.dirname(__file__), "qnabot-test-template.yaml")
    with open(file_name, "r", encoding="utf8") as a_file:
        data = a_file.read()
    return data


def mock_create_stack(client_cloudformation=None, stack_name=None, param1=None):
    params = [
        {"ParameterKey": "Param1", "ParameterValue": param1},
    ]
    client_cloudformation.create_stack(StackName=stack_name, TemplateBody=get_body(), Parameters=params)


def cloudformation_stacks():
    # setup mock cloudformation stack
    client_cloudformation = get_service_client("cloudformation")
    mock_create_stack(
        client_cloudformation=client_cloudformation,
        stack_name="test_stack",
        param1="test param 1",
    )


@pytest.fixture
def cloudformation_stacks_fixture():
    with mock_aws():
        cloudformation_stacks()
        yield
