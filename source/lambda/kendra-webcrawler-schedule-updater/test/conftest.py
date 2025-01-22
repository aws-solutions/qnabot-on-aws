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
    os.environ["DATASOURCE_NAME"] = "mock_data_source"
    os.environ["ROLE_ARN"] = "mock_role_arn"
    os.environ["DEFAULT_SETTINGS_PARAM"] = "test_default_setting_param"
    os.environ["PRIVATE_SETTINGS_PARAM"] = "test_private_setting_param"
    os.environ["CUSTOM_SETTINGS_PARAM"] = "test_custom_setting_param"
    os.environ["SOLUTION_ID"] = "SO0189"
    os.environ["SOLUTION_VERSION"] = "mock_version"
    os.environ["SETTINGS_TABLE"] = "mock_settings_table"
