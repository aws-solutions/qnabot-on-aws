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
from unittest.mock import patch, MagicMock, ANY
from moto import mock_aws

@mock_aws
class TestLambdaFunction(unittest.TestCase):
    def setUp(self):
        self.ssm_client = boto3.client("ssm")
        self.ssm_client.put_parameter(Name=os.environ["CUSTOM_SETTINGS_PARAM"], Type="String", 
                                    Value='{"ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT":"5","ENABLE_KENDRA_WEB_INDEXER":"true"}')
        self.ssm_client.put_parameter(Name=os.environ["PRIVATE_SETTINGS_PARAM"], Type="String", 
                                    Value='{"PRIVATE_SETTING":"private","NATIVE_LANGUAGE":"Spanish"}')
        patcher = patch('kendra_webcrawler_schedule_updater.kendra')
        self.addCleanup(patcher.stop)
        self.kendra_client_mock = patcher.start()
        self.kendra_client_mock.list_data_sources.return_value = {"SummaryItems": [{"Name":"mock_data_source", "Id": "mock_data_source_id"}]}
        self.kendra_client_mock.describe_data_source.return_value = {"Schedule": "cron(0 12 * * ? *)"}

    def test_update_schedule_changed_success(self):
        from kendra_webcrawler_schedule_updater import handler
        default_param_value = '{"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"rate(1 week)","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}'
        self.ssm_client.put_parameter(Name=os.environ["DEFAULT_SETTINGS_PARAM"], Type="String", Value=default_param_value)

        update_data_source_arguments = {'Id': 'mock_data_source_id', 
                                 'RoleArn': 'mock_role_arn',
                                 'Schedule': ANY,
                                 'IndexId': 'mock_kendra_index',
                                 'Configuration': ANY,
                                 'LanguageCode': 'es'
                                 }
        response = handler(MagicMock, MagicMock())
        self.kendra_client_mock.update_data_source.assert_called_with(**update_data_source_arguments)
        update_data_source_arguments = self.kendra_client_mock.update_data_source.call_args_list
        self.assertNotEqual("cron(0 12 * * ? *)",update_data_source_arguments[0].call.get('Schedule'))
        self.assertEqual("mock_kendra_index", response.get('IndexId'))
        self.assertEqual("mock_data_source_id", response.get('DataSourceId'))

        default_param_value = '{"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"monthly","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}'
        self.ssm_client.put_parameter(Name=os.environ["DEFAULT_SETTINGS_PARAM"], Type="String", Value=default_param_value, Overwrite=True)
        handler(MagicMock, MagicMock())
        update_data_source_arguments = self.kendra_client_mock.update_data_source.call_args_list
        self.assertNotEqual("cron(0 12 * * ? *)",update_data_source_arguments[1].call.get('Schedule'))


    def test_update_no_schedule_change(self):
        from kendra_webcrawler_schedule_updater import handler
        default_param_value = '{"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"rate(1 day)","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}'
        self.ssm_client.put_parameter(Name=os.environ["DEFAULT_SETTINGS_PARAM"], Type="String", Value=default_param_value)

        update_data_source_arguments = {'Id': 'mock_data_source_id', 
                                 'RoleArn': 'mock_role_arn',
                                 'Schedule': 'cron(0 12 * * ? *)',
                                 'IndexId': 'mock_kendra_index',
                                 'Configuration': ANY,
                                 'LanguageCode': 'es'
                                 }
        response = handler(MagicMock, MagicMock())
        self.assertEqual("mock_kendra_index", response.get('IndexId'))
        self.assertEqual("mock_data_source_id", response.get('DataSourceId'))
        self.kendra_client_mock.update_data_source.assert_called_with(**update_data_source_arguments)
    
    def test_lambda_invalid_schedule_exception(self):
        from kendra_webcrawler_schedule_updater import handler
        default_param_value = '{"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}'
        self.ssm_client.put_parameter(Name=os.environ["DEFAULT_SETTINGS_PARAM"], Type="String", Value=default_param_value)

        with self.assertRaises(Exception):
            handler(MagicMock, MagicMock())

        default_param_value = '{"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"invalid","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}'
        self.ssm_client.put_parameter(Name=os.environ["DEFAULT_SETTINGS_PARAM"], Type="String", Value=default_param_value, Overwrite=True)
        with self.assertRaises(Exception):
            handler(MagicMock, MagicMock())
