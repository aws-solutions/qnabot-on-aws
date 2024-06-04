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

import unittest
from unittest import mock
import boto3
from moto import mock_s3

bucket_name = 'test-bucket'
object_key = f'{bucket_name}/test-key'
non_existent_bucket = 'non-existent-bucket'

def mocked_cf_event(*args, **kwargs):
    return {
        "ResourceProperties": {
            "Bucket": f"{bucket_name}",
            "Prefix": f"{object_key}"
        }
    }

def mocked_cf_event_no_prefix(*args, **kwargs):
    return {
        "ResourceProperties": {
            "Bucket": f"{bucket_name}",
        }
    }

def mocked_cf_event_non_existent_bucket(*args, **kwargs):
    return {
        "ResourceProperties": {
            "Bucket": f"{non_existent_bucket}",
        }
    }

@mock_s3
class LambdaTest(unittest.TestCase):

    def setUp(self):
        conn = boto3.resource('s3', region_name='us-east-1')
        conn.create_bucket(Bucket=f'{bucket_name}')

        client = boto3.client('s3', region_name='us-east-1')
        client.put_bucket_versioning(
            Bucket=f'{bucket_name}',
            VersioningConfiguration={
                'Status': 'Enabled'
            }
        )

    def add_objects(self):
        client = boto3.client('s3', region_name='us-east-1')
        client.put_object(
            Bucket=f'{bucket_name}',
            Key=f'{object_key}',
            Body=b'00'
        )
        client.put_object(
            Bucket=f'{bucket_name}',
            Key=f'{object_key}',
            Body=b'01'
        )

    
    def add_lots_of_object_versions(self):
        client = boto3.client('s3', region_name='us-east-1')
        for i in range(0, 1001):
            client.put_object(
                Bucket=f'{bucket_name}',
                Key=f'{object_key}',
                Body=b'00'
            )


    def add_lots_of_objects(self):
        client = boto3.client('s3', region_name='us-east-1')
        for i in range(0, 1001):
            client.put_object(
                Bucket=f'{bucket_name}',
                Key=f'{object_key}-{i}',
                Body=b'00'
            )


    def test_no_op(self):
        from lambda_function import no_op

        try:
            no_op(None, None)
        except:
            self.fail("no_op raised an exception")

    
    def test_delete_bucket_prefix(self):
        from lambda_function import delete_bucket
        self.add_objects()
        
        try:
            delete_bucket(mocked_cf_event(), None)
        except Exception as error:
            self.fail(f"delete_bucket raised an exception: {error}")


    def test_delete_bucket(self):
        from lambda_function import delete_bucket
        self.add_objects()

        try:
            delete_bucket(mocked_cf_event_no_prefix(), None)
        except Exception as error:
            self.fail(f"delete_bucket (no prefix) raised an exception: {error}")


    def test_delete_non_existent_bucket(self):
        from lambda_function import delete_bucket

        try:
            delete_bucket(mocked_cf_event_non_existent_bucket(), None)
        except Exception as error:
            self.fail(f"test_delete_non_existent_bucket raised an exception: {error}")


    def test_delete_empty_bucket(self):
        from lambda_function import delete_bucket

        try:
            delete_bucket(mocked_cf_event(), None)
        except Exception as error:
            self.fail(f"delete_bucket raised an exception: {error}")


    def test_poll_delete_bucket_prefix(self):
        from lambda_function import poll_delete_bucket
        self.add_objects()

        try:
            returnValue = poll_delete_bucket(mocked_cf_event(), None)
            self.assertEqual(returnValue, None)
            returnValue = poll_delete_bucket(mocked_cf_event(), None)
            self.assertEqual(returnValue, True)
        except Exception as error:
            self.fail(f"poll_delete_bucket raised an exception: {error}")


    def test_poll_delete_bucket(self):
        from lambda_function import poll_delete_bucket
        self.add_objects()

        try:
            returnValue = poll_delete_bucket(mocked_cf_event_no_prefix(), None)
            self.assertEqual(returnValue, None)
            returnValue = poll_delete_bucket(mocked_cf_event_no_prefix(), None)
            self.assertEqual(returnValue, True)
        except Exception as error:
            self.fail(f"poll_delete_bucket (no prefix) raised an exception: {error}")


    def test_poll_delete_lots_of_versions(self):
        from lambda_function import poll_delete_bucket
        self.add_lots_of_object_versions()

        try:
            returnValue = poll_delete_bucket(mocked_cf_event_no_prefix(), None)
            self.assertEqual(returnValue, None)
            returnValue = poll_delete_bucket(mocked_cf_event_no_prefix(), None)
            self.assertEqual(returnValue, True)
        except Exception as error:
            self.fail(f"poll_delete_bucket (no prefix) raised an exception: {error}")


    def test_poll_delete_lots_of_objects(self):
        from lambda_function import poll_delete_bucket
        self.add_lots_of_objects()

        try:
            # poll_delete_bucket is called 3 times because there's more than 1000 objects in the bucket.
            # The first two calls should delete all of the objects, while the 3rd call expects that
            # there are no objects left in the bucket.
            returnValue = poll_delete_bucket(mocked_cf_event_no_prefix(), None)
            self.assertEqual(returnValue, None)
            returnValue = poll_delete_bucket(mocked_cf_event_no_prefix(), None)
            self.assertEqual(returnValue, None)
            returnValue = poll_delete_bucket(mocked_cf_event_no_prefix(), None)
            self.assertEqual(returnValue, True)
        except Exception as error:
            self.fail(f"poll_delete_bucket (no prefix) raised an exception: {error}")


    def test_poll_delete_empty_bucket(self):
        from lambda_function import poll_delete_bucket

        try:
            returnValue = poll_delete_bucket(mocked_cf_event_no_prefix(), None)
            self.assertEqual(returnValue, True)
        except Exception as error:
            self.fail(f"poll_delete_bucket raised an exception: {error}")
