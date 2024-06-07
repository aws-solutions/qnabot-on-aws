######################################################################################################################
#  Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                      #
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

import unittest, requests
from unittest import mock

def mocked_requests_post(*args, **kwargs):
    class MockResponse:
        def __init__(self, status_code, reason):
            self.status_code = status_code
            self.reason = reason

    return MockResponse(200, 'OK')

class LambdaTest(unittest.TestCase):
    def test_create_unique_id(self):
        import lambda_function

        event = {
            'RequestType': 'Create',
            'ResourceProperties': { 'Resource': 'UUID' }
        }

        lambda_function.custom_resource(event, None)
        self.assertIsNotNone(lambda_function.helper.Data.get('UUID'))

    @mock.patch('requests.post', side_effect=mocked_requests_post)
    def test_send_metrics_successful(self, mock_post):
        event = {
            'RequestType': 'Create',
            'ResourceProperties': {
                'Resource': 'AnonymizedMetric',
                'SolutionId': 'SO1234',
                'UUID': 'some-uuid',
                'Foo': 'Bar'
            }
        }

        from lambda_function import custom_resource
        custom_resource(event, None)

        expected_metrics_endpoint = 'https://metrics.awssolutionsbuilder.com/generic'
        actual_metrics_endpoint = mock_post.call_args.args[0]
        self.assertEqual(expected_metrics_endpoint, actual_metrics_endpoint)

        expected_headers = {'Content-Type': 'application/json'}
        actual_headers = mock_post.call_args.kwargs['headers']
        self.assertEqual(expected_headers, actual_headers)

        actual_payload = mock_post.call_args.kwargs['json']
        self.assertIn('Solution', actual_payload)
        self.assertIn('UUID', actual_payload)
        self.assertIn('TimeStamp', actual_payload)

        self.assertIn('Data', actual_payload)
        self.assertEqual(actual_payload['Data'], {'Foo': 'Bar', 'RequestType': 'Create'})

    @mock.patch('requests.post')
    def test_send_metrics_connection_error(self, mock_post):
        mock_post.side_effect = requests.exceptions.ConnectionError()

        event = {
            'RequestType': 'Update',
            'ResourceProperties': {
                'Resource': 'AnonymizedMetric',
                'SolutionId': 'SO1234',
                'UUID': 'some-uuid'
            }
        }

        try:
            from lambda_function import custom_resource
            custom_resource(event, None)
        except requests.exceptions.RequestException:
            self.fail('Exception should not be raised when metrics cannot be sent')

    @mock.patch('requests.post')
    def test_send_metrics_other_error(self, mock_post):
        try:
            invalid_event = {
                'RequestType': 'Delete',
                'ResourceProperties': {
                    'Resource': 'AnonymizedMetric',
                    'UUID': 'some-uuid'
                }
            }

            from lambda_function import custom_resource
            custom_resource(invalid_event, None)
        except requests.exceptions.RequestException:
            self.fail('Exception should not be raised when metrics cannot be sent')

    def test_sanitize_data(self):
        from lambda_function import _sanitize_data

        resource_properties = {
            'ServiceToken': 'lambda-fn-arn',
            'Resource': 'AnonymizedMetric',
            'SolutionId': 'SO1234',
            'UUID': 'some-uuid',
            'Region': 'us-east-1',
            'Foo': 'Bar'
        }

        expected_response = {
            'Region': 'us-east-1',
            'Foo': 'Bar'
        }

        actual_response = _sanitize_data(resource_properties)
        self.assertCountEqual(expected_response, actual_response)
