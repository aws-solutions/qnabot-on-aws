#!/usr/bin/env python3
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os
import logging
import warnings

import pytest

logger = logging.getLogger(__name__)

# Safe to ignore particular warning in the the following third-party libraries
# - Exception ignored in: <socket.socket fd=10, family=AddressFamily.AF_INET, type=SocketKind.SOCK_DGRAM, proto=0, laddr=('0.0.0.0', 0)>
# - ResourceWarning: unclosed <socket.socket fd=10, family=AddressFamily.AF_INET, type=SocketKind.SOCK_DGRAM, proto=0, laddr=('0.0.0.0', 0)>
warnings.simplefilter("ignore", ResourceWarning)


@pytest.fixture(autouse=True)
def aws_environment_variables():
    """Mocked AWS environment variables such as AWS credentials and region"""
    os.environ["AWS_ACCESS_KEY_ID"] = "mocked-aws-access-key-id"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "mocked-aws-secret-access-key"
    os.environ["AWS_SESSION_TOKEN"] = "mocked-aws-session-token"


# customize as needed during development
collect_ignore_glob = []
collect_ignore = []
