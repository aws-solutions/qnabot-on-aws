######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################
import os
import unittest
import boto3
from unittest.mock import patch, MagicMock, ANY
from moto import mock_aws
import json



@mock_aws
class TestLambdaFunction(unittest.TestCase):
    def putDynamoDB(self, settings_object, dynamodb_client):

        with open('../../lambda/cfn/lib/DefaultSettings.json', 'r') as f:
            default_settings = json.load(f)
            
        
        table_name = os.environ['SETTINGS_TABLE']
        
        # Process each setting
        for setting_name, setting_value in settings_object.items():
            # Look up default values from JSON, use Custom/blank if not found
            default_setting = default_settings.get(setting_name, {})
            category = default_setting.get('Category', 'Custom')
            default_value = default_setting.get('DefaultValue', '')
            
            # Construct DynamoDB item
            item = {
                'SettingName': {'S': setting_name},
                'SettingValue': {'S': str(setting_value)},
                'SettingCategory': {'S': category},
                'DefaultValue': {'S': str(default_value)}
            }
            
            # Put item into DynamoDB
            dynamodb_client.put_item(
                TableName=table_name,
                Item=item
            )

    def setUp(self):
        self.dynamodb_client = boto3.client("dynamodb")
        self.dynamodb_client.create_table(
            BillingMode='PAY_PER_REQUEST',
            TableName=os.environ['SETTINGS_TABLE'],
            KeySchema=[
                {
                    'AttributeName': 'SettingName',
                    'KeyType': 'HASH'  # Partition key
                },
                {
                    'AttributeName': 'SettingCategory',
                    'KeyType': 'RANGE'  # Sort key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'SettingName',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'SettingCategory',
                    'AttributeType': 'S'  # Sort key
                }
            ]
        )
        self.putDynamoDB({"ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT":"5","ENABLE_KENDRA_WEB_INDEXER":"true", "PRIVATE_SETTING":"private","NATIVE_LANGUAGE":"Spanish"}, self.dynamodb_client)
        patcher = patch('kendra_webcrawler_schedule_updater.kendra')
        self.addCleanup(patcher.stop)
        self.kendra_client_mock = patcher.start()
        self.kendra_client_mock.list_data_sources.return_value = {"SummaryItems": [{"Name":"mock_data_source", "Id": "mock_data_source_id"}]}
        self.kendra_client_mock.describe_data_source.return_value = {"Schedule": "cron(0 12 * * ? *)"}

    def test_update_schedule_changed_success(self):
        from kendra_webcrawler_schedule_updater import handler
        default_param_value = {"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"rate(1 week)","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}
        self.putDynamoDB(default_param_value, self.dynamodb_client)
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

        default_param_value = {"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"monthly","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}
        self.putDynamoDB(default_param_value, self.dynamodb_client)
        handler(MagicMock, MagicMock())
        update_data_source_arguments = self.kendra_client_mock.update_data_source.call_args_list
        self.assertNotEqual("cron(0 12 * * ? *)",update_data_source_arguments[1].call.get('Schedule'))


    def test_update_no_schedule_change(self):
        from kendra_webcrawler_schedule_updater import handler
        default_param_value = {"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"rate(1 day)","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}
        self.putDynamoDB(default_param_value, self.dynamodb_client)

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
        default_param_value = {"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":None,"KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}
        self.putDynamoDB(default_param_value, self.dynamodb_client)
        with self.assertRaises(Exception):
            handler(MagicMock, MagicMock())
        default_param_value = {"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"invalid","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}
        self.putDynamoDB(default_param_value, self.dynamodb_client)
        with self.assertRaises(Exception):
            handler(MagicMock, MagicMock())
