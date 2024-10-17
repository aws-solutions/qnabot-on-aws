######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
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
