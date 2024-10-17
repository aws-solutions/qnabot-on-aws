#!/usr/bin/env python
######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import os
import pytest

@pytest.fixture(autouse=True)
def aws_environment_variables():
    """Mocked AWS evivronment variables such as AWS credentials and region"""
    os.environ["AWS_ACCESS_KEY_ID"] = "mocked-aws-access-key-id"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "mocked-aws-secret-access-key"
    os.environ["AWS_SESSION_TOKEN"] = "mocked-aws-session-token"
    os.environ["AWS_REGION"] = "us-east-1"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
    os.environ["AWS_SDK_USER_AGENT"] = '{ "user_agent_extra": "solution/fakeID/fakeVersion" }'
    os.environ["CFSTACK"] = "test"
    os.environ["SOLUTION_ID"] = "SO0189"
    os.environ["SOLUTION_VERSION"] = "mock_version"
    os.environ["AWS_LAMBDA_FUNCTION_NAME"] = "mock_function"
    os.environ["FIREHOSE_NAME"] = "firehose"
    os.environ["SNS_TOPIC_ARN"] = "arn:sns:topic"
