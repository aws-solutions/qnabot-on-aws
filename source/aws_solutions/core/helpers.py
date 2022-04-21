# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os

import boto3

import aws_solutions.core.config

_helpers_service_clients = {}
_helpers_service_resources = {}
_SESSION = None


class EnvironmentVariableError(Exception):
    pass


def get_aws_region():
    """
    Get the caller's AWS region from the environment variable AWS_REGION
    :return: the AWS region name (e.g. us-east-1)
    """
    region = os.environ.get("AWS_REGION")
    if not region:
        raise EnvironmentVariableError("Missing AWS_REGION environment variable.")

    return region


def get_aws_partition():
    """
    Get the caller's AWS partion by driving it from AWS region
    :return: partition name for the current AWS region (e.g. aws)
    """
    region_name = get_aws_region()
    china_region_name_prefix = "cn"
    us_gov_cloud_region_name_prefix = "us-gov"
    aws_regions_partition = "aws"
    aws_china_regions_partition = "aws-cn"
    aws_us_gov_cloud_regions_partition = "aws-us-gov"

    # China regions
    if region_name.startswith(china_region_name_prefix):
        return aws_china_regions_partition

    # AWS GovCloud(US) Regions
    if region_name.startswith(us_gov_cloud_region_name_prefix):
        return aws_us_gov_cloud_regions_partition

    return aws_regions_partition


def get_session():
    global _SESSION  # pylint: disable=global-statement
    if not _SESSION:
        _SESSION = boto3.session.Session()
    return _SESSION


def get_service_client(service_name):
    config = aws_solutions.core.config.botocore_config
    session = get_session()

    if service_name not in _helpers_service_clients:
        _helpers_service_clients[service_name] = session.client(
            service_name, config=config, region_name=get_aws_region()
        )
    return _helpers_service_clients[service_name]


def get_service_resource(service_name):
    config = aws_solutions.core.config.botocore_config
    session = get_session()

    if service_name not in _helpers_service_resources:
        _helpers_service_resources[service_name] = session.resource(
            service_name, config=config, region_name=get_aws_region()
        )
    return _helpers_service_resources[service_name]


def get_aws_account() -> str:
    """
    Get the caller's AWS account ID from STS
    :return: the AWS account ID of the caller
    """
    sts = get_service_client("sts")
    return sts.get_caller_identity().get("Account")
