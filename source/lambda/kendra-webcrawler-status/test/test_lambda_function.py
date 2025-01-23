######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################
import os
import unittest
import boto3
from unittest.mock import patch, MagicMock, Mock
from moto import mock_aws
from datetime import datetime
from botocore.exceptions import ClientError
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
        self.putDynamoDB({"ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT":"5","ENABLE_KENDRA_WEB_INDEXER":"true", "KENDRA_WEB_PAGE_INDEX":"mock_kendra_index", "PRIVATE_SETTING":"private"}, self.dynamodb_client)
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
        with patch('boto3.client') as mock_client:
            mock_dynamodb = Mock()
            mock_client.return_value = mock_dynamodb
            
            # Set up the error to be raised when scan is called
            mock_dynamodb.get_paginator.return_value.paginate.side_effect = ClientError(
                {'Error': {'Code': 'ParameterNotFound', 'Message': 'Parameter not found'}}, 
                'GetParameter'
            )
            with self.assertRaises(ClientError) as context:
                get_settings()
            self.assertEqual(context.exception.response['Error']['Code'], 'ParameterNotFound')
            self.assertEqual(context.exception.response['Error']['Message'], 'Parameter not found')

    def test_handler_exception_throttling(self):
        from kendra_webcrawler_status import handler, CrawlerException
        with patch('boto3.client') as mock_client:
            mock_dynamodb = Mock()
            mock_client.return_value = mock_dynamodb
            mock_dynamodb.get_paginator.return_value.paginate.side_effect = ClientError(
                {'Error': {'Code': 'ParameterNotFound', 'Message': 'Request rate exceeded'}}, 'GetParameter')
            with self.assertRaises(CrawlerException) as context:
                handler(MagicMock, MagicMock())
            self.assertEqual(str(context.exception), 'Exception: Failed to process this request. Please check the lambda logs for more further details.')
