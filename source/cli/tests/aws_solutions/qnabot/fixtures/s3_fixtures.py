######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import json
import logging
import pytest
import boto3
from moto import mock_aws
from aws_solutions.core.helpers import get_service_resource

logger = logging.getLogger(__name__)

@mock_aws
def mock_import_event(*args):
    bucket_name = args[0]
    conn = boto3.resource("s3", region_name="us-east-1")
    conn.create_bucket(Bucket=bucket_name)

    # import status file
    key = f"status-import/blog-samples.json"
    obj_status_details = {
        "status": "Complete",
        "failed": "mock",
        "count": 10,
        "time": {
            "start": "mock",
            "end": "mock",
        },
    }

    s3_obj = conn.Object(bucket_name, key)
    status_json = json.dumps(obj_status_details).encode("UTF-8")
    s3_obj.put(Body=(bytes(status_json)), ACL="bucket-owner-full-control")

    key = f"status-import/test_questions.xlsx"
    obj_status_details = {
        "status": "Complete",
        "failed": "0",
        "count": 2,
        "time": {
            "start": "mock",
            "end": "mock",
        },
    }

    s3_obj = conn.Object(bucket_name, key)
    status_json = json.dumps(obj_status_details).encode("UTF-8")
    s3_obj.put(Body=(bytes(status_json)), ACL="bucket-owner-full-control")



@mock_aws
def mock_export_event(*args):
    content_designer_output_bucket_name = args[0]

    conn = boto3.resource("s3", region_name="us-east-1")
    conn.create_bucket(Bucket=content_designer_output_bucket_name)

    # export status file
    key = f"status-export/sample.json"
    export_status = {
        "status": "Completed",
        "error_code": "mock",
    }
    s3_obj = conn.Object(content_designer_output_bucket_name, key)
    status_json = json.dumps(export_status).encode("UTF-8")
    s3_obj.put(Body=(bytes(status_json)), ACL="bucket-owner-full-control")

    # download status file
    key = f"data-export/sample.json"
    download_status = {
        "status": "Downloaded",
        "error_code": "mock",
    }
    
    s3_obj = conn.Object(content_designer_output_bucket_name, key)
    status_json = json.dumps(download_status).encode("UTF-8")
    s3_obj.put(Body=(bytes(status_json)), ACL="bucket-owner-full-control")
