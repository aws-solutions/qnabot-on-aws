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

import os
import boto3
import unittest, requests
from unittest import mock
from unittest.mock import patch
from moto import mock_aws
from botocore.exceptions import ClientError

mocked_settings = [
    {
        "SettingName": "ENABLE_MULTI_LANGUAGE_SUPPORT", 
        "SettingCategory": "LanguageID", 
        "SettingValue": "", 
        "DefaultValue": "false"
    },
    {
        "SettingName": "LLM_GENERATE_QUERY_ENABLE", 
        "SettingCategory": "QueryMatching", 
        "SettingValue": "", 
        "DefaultValue": "true"
    },
    {
        "SettingName": "KNOWLEDGE_BASE_SEARCH_TYPE", 
        "SettingCategory": "BedrockRag", 
        "SettingValue": "", 
        "DefaultValue": "DEFAULT"
    },
    {
        "SettingName": "PII_REJECTION_ENABLED", 
        "SettingCategory": "Security", 
        "SettingValue": "", 
        "DefaultValue": "false"
    },
    {
        "SettingName": "EMBEDDINGS_ENABLE", 
        "SettingCategory": "Security", 
        "SettingValue": "", 
        "DefaultValue": "true"
    },
    {
       "SettingName": "LLM_QA_ENABLE", 
       "SettingCategory": "LLMSettings", 
       "SettingValue": "", 
       "DefaultValue": "true"
    },
    {
        "SettingName": "FALLBACK_ORDER", 
        "SettingCategory": "LLMSettings", 
        "SettingValue": "", 
        "DefaultValue": "KNOWLEDGEBASE-FIRST"
    },
    {
        "SettingName": "ENABLE_REDACTING", 
        "SettingCategory": "Security", 
        "SettingValue": "", 
        "DefaultValue": "false"
    },
    {
        "SettingName": "ENABLE_REDACTING_WITH_COMPREHEND", 
        "SettingCategory": "Security", 
        "SettingValue": "", 
        "DefaultValue": "false"
    }
        ]

def mocked_requests_post(*args, **kwargs):
    class MockResponse:
        def __init__(self, status_code, reason):
            self.status_code = status_code
            self.reason = reason

    return MockResponse(200, 'OK')
@mock_aws
class LambdaTest(unittest.TestCase):

    def setUp(self):
        self.mock_aws = mock_aws()
        self.mock_aws.start()
        self.ssm_client = boto3.client('ssm')
        self.dynamodb_client = boto3.client('dynamodb')
        self.ssm_client.put_parameter(Name=os.environ["SOLUTION_PARAMETER"], Type="SecureString", Value='some-uuid', Overwrite=True)
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
        #send an empty custom settings to test the default values
        for setting in mocked_settings:
            self.dynamodb_client.put_item(TableName=os.environ["SETTINGS_TABLE"], 
            Item={ 
                'SettingName': {'S': setting["SettingName"]}, 
                'SettingCategory': {'S': setting["SettingCategory"]}, 
                'SettingValue': {'S': setting["SettingValue"]},
                'DefaultValue': {'S': setting["DefaultValue"]} 
                }
            )

    def tearDown(self):
        self.dynamodb_client.delete_table(TableName=os.environ['SETTINGS_TABLE'])
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
    
        # Assert the first mock call
        first_call_args = mock_post.call_args_list[0]
        expected_metrics_endpoint = 'https://metrics.awssolutionsbuilder.com/generic'
        actual_metrics_endpoint = first_call_args.args[0]
        self.assertEqual(expected_metrics_endpoint, actual_metrics_endpoint)
    
        expected_headers = {'Content-Type': 'application/json'}
        actual_headers = first_call_args.kwargs['headers']
        self.assertEqual(expected_headers, actual_headers)
    
        actual_payload = first_call_args.kwargs['json']
        self.assertIn('Solution', actual_payload)
        self.assertIn('UUID', actual_payload)
        self.assertIn('TimeStamp', actual_payload)
        self.assertIn('Data', actual_payload)
    
        # Assert the default values in the payload
        self.assertEqual(actual_payload['Data'], {'Foo': 'Bar', 'RequestType': 'Create'})
        
        # Assert the second mock call 
        second_call_args = mock_post.call_args_list[1]
        expected_metrics_endpoint = 'https://metrics.awssolutionsbuilder.com/generic'
        actual_metrics_endpoint = second_call_args.args[0]
        self.assertEqual(expected_metrics_endpoint, actual_metrics_endpoint)
    
        expected_headers = {'Content-Type': 'application/json'}
        actual_headers = second_call_args.kwargs['headers']
        self.assertEqual(expected_headers, actual_headers)
    
        actual_payload = second_call_args.kwargs['json']
        self.assertIn('Solution', actual_payload)
        self.assertIn('UUID', actual_payload)
        self.assertIn('TimeStamp', actual_payload)
        self.assertIn('Data', actual_payload)
    
        # Assert the payload values for the second call
        self.assertEqual(actual_payload['Data'], {'BEDROCK_GUARDRAIL_ENABLE': 'false', 'PREPROCESS_GUARDRAIL_ENABLE': 'false', 'POSTPROCESS_GUARDRAIL_ENABLE': 'false', 'ENABLE_MULTI_LANGUAGE_SUPPORT': 'false', 'LLM_GENERATE_QUERY_ENABLE': 'true', 'KNOWLEDGE_BASE_SEARCH_TYPE': 'DEFAULT', 'PII_REJECTION_ENABLED': 'false', 'EMBEDDINGS_ENABLE': 'true', 'LLM_QA_ENABLE': 'true', 'FALLBACK_ORDER': 'KNOWLEDGEBASE-FIRST', 'event': 'UPDATE_SETTINGS', 'ENABLE_REDACTING': 'false', 'ENABLE_REDACTING_WITH_COMPREHEND': 'false', 'KNOWLEDGE_BASE_METADATA_FILTERS_ENABLE': 'false'})         

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
            mock_parameter_value = '{}'
            with patch('lambda_function.ssm_client.get_parameter') as mock_get_parameter:
                mock_get_parameter.return_value =  mock_parameter_value
            
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
    
    @mock.patch('requests.post', side_effect=mocked_requests_post)
    def test_send_metrics_successful_when_event(self, mock_post):
        from lambda_function import handler
        
        event = {
                 'event': 'UPDATE_SETTINGS', 
                 'BEDROCK_GUARDRAIL_ENABLE': 'true',
                 'PREPROCESS_GUARDRAIL_ENABLE': 'true',
                 'POSTPROCESS_GUARDRAIL_ENABLE': 'true',
                 'ENABLE_MULTI_LANGUAGE_SUPPORT': 'false',
                 'LLM_GENERATE_QUERY_ENABLE': 'true', 
                 'KNOWLEDGE_BASE_SEARCH_TYPE': 'DEFAULT', 
                 'PII_REJECTION_ENABLED': 'false', 
                 'EMBEDDINGS_ENABLE': 'true',
                 'LLM_QA_ENABLE': 'true',
                 'ENABLE_REDACTING': 'true',
                 'ENABLE_REDACTING_WITH_COMPREHEND': 'false',
                 'KNOWLEDGE_BASE_METADATA_FILTERS_ENABLE': 'false'
                 }

        mock_parameter_value = "some-uuid"
        with patch('lambda_function.ssm_client.get_parameter') as mock_get_parameter:
            mock_get_parameter.return_value =  mock_parameter_value

       
        handler(event, None)
        
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
        self.assertEqual(actual_payload['Data'], event)
        
    def test_get_settings_parameter_not_found(self):
        parameter_name = 'unknown'
        from lambda_function import get_parameter
        with patch('lambda_function.ssm_client.get_parameter') as mock_get_parameter:
            mock_get_parameter.side_effect = ClientError(
                {'Error': {'Code': 'ParameterNotFound', 'Message': 'Parameter not found'}}, 'GetParameter')
            with self.assertRaises(ClientError) as context:
                get_parameter(parameter_name)
            self.assertEqual(context.exception.response['Error']['Code'], 'ParameterNotFound')
            self.assertEqual(context.exception.response['Error']['Message'], 'Parameter not found')
            
    def test_update_parameter_not_found(self):
        parameter_name = 'unknown'
        parameter_value = 'some-value'
        from lambda_function import update_parameter
        with patch('lambda_function.ssm_client.put_parameter') as mock_put_parameter:
            mock_put_parameter.side_effect = ClientError(
                {'Error': {'Code': 'ParameterNotFound', 'Message': 'Parameter not found'}}, 'GetParameter')
            with self.assertRaises(ClientError) as context:
                update_parameter(parameter_name, parameter_value)
            self.assertEqual(context.exception.response['Error']['Code'], 'ParameterNotFound')
            self.assertEqual(context.exception.response['Error']['Message'], 'Parameter not found')