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

import pytest
from moto import mock_sts

from aws_solutions.core import (
    get_aws_region,
    get_service_client,
    get_aws_partition,
    get_aws_account,
    get_service_resource,
)


@pytest.fixture(autouse=True, scope="module")
def valid_solution_env():
    os.environ["AWS_REGION"] = "us-east-1"
    os.environ["SOLUTION_ID"] = "SO9900"
    os.environ["SOLUTION_VERSION"] = "v0.0.1"
    yield
    del os.environ["AWS_REGION"]
    del os.environ["SOLUTION_ID"]
    del os.environ["SOLUTION_VERSION"]


def test_get_aws_region_valid():
    assert get_aws_region() == "us-east-1"


def test_get_service_client():
    cli = get_service_client("ec2")
    assert cli.meta.service_model.service_name == "ec2"


def test_get_service_resource():
    ec2 = get_service_resource("ec2")
    assert ec2.meta.service_name == "ec2"


@pytest.mark.parametrize(
    "region,partition",
    [
        ("us-east-1", "aws"),
        ("us-gov-west-1", "aws-us-gov"),
        ("us-gov-west-2", "aws-us-gov"),
        ("cn-north-1", "aws-cn"),
        ("cn-northwest-1", "aws-cn"),
    ],
)
def test_get_aws_partition(region, partition, mocker):
    mocker.patch("aws_solutions.core.helpers.get_aws_region", return_value=region)
    assert get_aws_partition() == partition


@mock_sts
def test_get_aws_account_id(mocker):
    assert get_aws_account() == "1" * 12
