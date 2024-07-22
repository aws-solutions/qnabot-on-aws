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
import unittest
import boto3
from unittest.mock import patch, MagicMock
from moto import mock_ssm
from datetime import datetime
from botocore.exceptions import ClientError

@mock_ssm
class TestLambdaFunction(unittest.TestCase):
    def setUp(self):
        self.ssm_client = boto3.client("ssm")
        self.ssm_client.put_parameter(Name=os.environ["CUSTOM_SETTINGS_PARAM"], Type="String", 
                                    Value='{"ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT":"5","ENABLE_KENDRA_WEB_INDEXER":"true"}')
        self.ssm_client.put_parameter(Name=os.environ["DEFAULT_SETTINGS_PARAM"], Type="String", Value='{"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index"}')
        self.ssm_client.put_parameter(Name=os.environ["PRIVATE_SETTINGS_PARAM"], Type="String", Value='{"PRIVATE_SETTING":"private"}')
        patcher = patch('kendra_webcrawler_status.client')
        self.addCleanup(patcher.stop)
        self.kendra_client_mock = patcher.start()
    
    def test_handler_get_status(self):
        from kendra_webcrawler_status import handler
        self.kendra_client_mock.list_data_sources.return_value = {"SummaryItems": [{"Name":"mock_data_source", "Id": "mock_data_source_id"}]}
        self.kendra_client_mock.describe_data_source.return_value = {"Status":"ACTIVE"}
        self.kendra_client_mock.list_data_source_sync_jobs.return_value = {"History":[]}
        response = handler(MagicMock, MagicMock())
        self.assertEqual("ACTIVE", response.get('Status'))
        self.assertEqual("", response.get('History'))
        self.kendra_client_mock.describe_data_source.assert_called()
        self.kendra_client_mock.list_data_source_sync_jobs.assert_called()

        self.kendra_client_mock.describe_data_source.return_value = {"Status":"FAILED"}
        response = handler(MagicMock, MagicMock())
        self.assertEqual("FAILED", response.get('Status'))

        self.kendra_client_mock.describe_data_source.return_value = {"Status":"ACTIVE"}
        self.kendra_client_mock.list_data_source_sync_jobs.return_value = {"History": [
            {
                "StartTime": datetime(2023, 10, 4),
                "EndTime": datetime(2023, 10, 4),
                "Status": "COMPLETE",
                "Metrics": {
                    "DocumentsAdded": "100",
                    "DocumentsModified": "0",
                    "DocumentsDeleted": "0",
                    "DocumentsFailed": "0",
                    "DocumentsScanned": "100"
                }
            }]}
        response = handler(MagicMock, MagicMock())
        self.assertEqual("COMPLETE", response.get('Status'))
        self.assertNotEqual("", response.get('History'))
    
    def test_handler_get_status_data_source_not_found(self):
        from kendra_webcrawler_status import handler
        self.kendra_client_mock.list_data_sources.return_value = {"SummaryItems": [{"Name":"mock_data_source1", "Id": "mock_data_source1_id"}]}
        response = handler(MagicMock, MagicMock())
        self.assertEqual("NOTINDEXED", response.get('Status'))

    def test_get_settings_parameter_not_found(self):
        from kendra_webcrawler_status import get_settings
        with patch('kendra_webcrawler_status.ssm.get_parameter') as mock_get_parameter:
            mock_get_parameter.side_effect = ClientError(
                {'Error': {'Code': 'ParameterNotFound', 'Message': 'Parameter not found'}}, 'GetParameter')
            with self.assertRaises(ClientError) as context:
                get_settings()
            self.assertEqual(context.exception.response['Error']['Code'], 'ParameterNotFound')
            self.assertEqual(context.exception.response['Error']['Message'], 'Parameter not found')

    def test_handler_exception_throttling(self):
        from kendra_webcrawler_status import handler, CrawlerException
        with patch('kendra_webcrawler_status.ssm.get_parameter') as mock_get_parameter:
            mock_get_parameter.side_effect = ClientError(
                {'Error': {'Code': 'ThrottlingException', 'Message': 'Request rate exceeded'}}, 'GetParameter')
            with self.assertRaises(CrawlerException) as context:
                handler(MagicMock, MagicMock())
            self.assertEqual(str(context.exception), 'Exception: Failed to process this request. Please check the lambda logs for more further details.')
