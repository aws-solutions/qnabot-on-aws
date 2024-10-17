######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import json
import logging

import pytest
from moto import mock_aws

from aws_solutions.core.helpers import get_service_resource

logger = logging.getLogger(__name__)


def mock_import_event(*args):
    bucket_name = args[0]
    file_name = args[1]

    # import status file
    key = f"status/{file_name}"
    logger.debug(f"Mocking import for {bucket_name=}, {key=}")
    s3_resource = get_service_resource("s3")
    obj_status_details = {
        "status": "Complete",
        "failed": "mock",
        "count": 10,
        "time": {
            "start": "mock",
            "end": "mock",
        },
    }

    s3_obj = s3_resource.Object(bucket_name, key)
    status_json = json.dumps(obj_status_details).encode("UTF-8")
    s3_obj.put(Body=(bytes(status_json)), ACL="bucket-owner-full-control")


def mock_export_event(*args):
    bucket_name = args[0]
    s3_resource = get_service_resource("s3")

    # export status file
    key = "status/sample.json"
    export_status = {
        "status": "Completed",
        "error_code": "mock",
    }
    s3_obj = s3_resource.Object(bucket_name, key)
    status_json = json.dumps(export_status).encode("UTF-8")
    logger.debug(f"Mocking export event {bucket_name=}, {key=}")
    s3_obj.put(Body=(bytes(status_json)), ACL="bucket-owner-full-control")

    # export data file
    key = "data/sample.json"
    export_data = {
        "mock_attribute": "mock_value",
    }
    s3_obj = s3_resource.Object(bucket_name, key)
    status_json = json.dumps(export_data).encode("UTF-8")
    logger.debug(f"Mocking export event {bucket_name=}, {key=}")
    s3_obj.put(Body=(bytes(status_json)), ACL="bucket-owner-full-control")


def get_s3_fixture(bucket_name=None):
    s3_resource = get_service_resource("s3")
    if not bucket_name:
        bucket_name = "test_bucket"
    s3_resource.create_bucket(Bucket=bucket_name)
    logger.debug("Using pytest fixture: get_s3_fixture")


@pytest.fixture
def s3_fixture():
    with mock_aws():
        get_s3_fixture()
        yield
