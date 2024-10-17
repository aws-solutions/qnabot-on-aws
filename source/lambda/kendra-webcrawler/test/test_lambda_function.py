######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import os
import unittest
import boto3
from unittest.mock import patch, MagicMock
from moto import mock_aws

@mock_aws
class TestLambdaFunction(unittest.TestCase):
    def setUp(self):
        self.ssm_client = boto3.client("ssm")
        self.ssm_client.put_parameter(Name=os.environ["CUSTOM_SETTINGS_PARAM"], Type="String", 
                                    Value='{"ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT":"5","ENABLE_KENDRA_WEB_INDEXER":"true"}')
        self.ssm_client.put_parameter(Name=os.environ["DEFAULT_SETTINGS_PARAM"], Type="String", 
                                      Value='{"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"rate(1 week)","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}')
        self.ssm_client.put_parameter(Name=os.environ["PRIVATE_SETTINGS_PARAM"], Type="String", 
                                      Value='{"PRIVATE_SETTING":"private","NATIVE_LANGUAGE":"Spanish"}')
        self.cloudwatch_client = boto3.client('cloudwatch')
        patcher = patch('kendra_webcrawler.client')
        self.addCleanup(patcher.stop)
        self.kendra_client_mock = patcher.start()
    
    def test_handler_create_datasource_success(self):
        from kendra_webcrawler import handler
        self.counter = 0
        self.request_type = "CREATING"
        self.kendra_client_mock.list_data_sources.return_value = {"SummaryItems": [{"Name":"mock_data_source1", "Id": "mock_data_source1_id"}]}
        self.kendra_client_mock.create_data_source.return_value = {"Id": "mock_data_source_id"}
        self.kendra_client_mock.describe_data_source.side_effect = self.describe_data_source_mock
        response = handler(MagicMock, MagicMock())
        self.assertEqual("mock_kendra_index", response.get('IndexId'))
        self.assertEqual("mock_data_source_id", response.get('DataSourceId'))
        self.kendra_client_mock.create_data_source.assert_called()
        self.kendra_client_mock.start_data_source_sync_job.assert_called()
        cloudwatch_dashboard = self.cloudwatch_client.get_dashboard(DashboardName=os.environ.get('DASHBOARD_NAME'))
        self.assertEqual(os.environ.get('DASHBOARD_NAME'), cloudwatch_dashboard.get('DashboardName'))
        assert cloudwatch_dashboard.get('DashboardArn') is not None
    
    def test_handler_create_datasource_failed(self):
        from kendra_webcrawler import handler
        self.kendra_client_mock.list_data_sources.return_value = {"SummaryItems": [{"Name":"mock_data_source1", "Id": "mock_data_source1_id"}]}
        self.kendra_client_mock.create_data_source.return_value = {"Id": "mock_data_source_id"}
        self.kendra_client_mock.describe_data_source.return_value = {"Status":"FAILED"}
        response = handler(MagicMock, MagicMock())
        self.assertEqual("mock_kendra_index", response.get('IndexId'))
        self.assertEqual("mock_data_source_id", response.get('DataSourceId'))
        self.kendra_client_mock.create_data_source.assert_called()
        self.kendra_client_mock.start_data_source_sync_job.assert_not_called()
        with self.assertRaisesRegex(Exception, "ResourceNotFound"):
            self.cloudwatch_client.get_dashboard(DashboardName=os.environ.get('DASHBOARD_NAME'))

    def test_handler_update_datasource_success(self):
        from kendra_webcrawler import handler
        self.counter = 0
        self.request_type = "UPDATING"
        self.kendra_client_mock.list_data_sources.return_value = {"SummaryItems": [{"Name":"mock_data_source", "Id": "mock_data_source_id"}]}
        self.kendra_client_mock.describe_data_source.side_effect = self.describe_data_source_mock

        response = handler(MagicMock, MagicMock())
        self.assertEqual("mock_kendra_index", response.get('IndexId'))
        self.assertEqual("mock_data_source_id", response.get('DataSourceId'))
        self.kendra_client_mock.create_data_source.assert_not_called()
        self.kendra_client_mock.update_data_source.assert_called()

    def test_handler_update_datasource_failed(self):
        from kendra_webcrawler import handler
        default_param_value = '{"KENDRA_WEB_PAGE_INDEX":"mock_kendra_index","KENDRA_INDEXER_URLS":"mock_indexer_urls","KENDRA_INDEXER_SCHEDULE":"invalid","KENDRA_INDEXER_CRAWL_MODE":"SUBDOMAINS","KENDRA_INDEXER_CRAWL_DEPTH":"3"}'
        self.ssm_client.put_parameter(Name=os.environ["DEFAULT_SETTINGS_PARAM"], Type="String", Value=default_param_value, Overwrite=True)
        self.kendra_client_mock.list_data_sources.return_value = {"SummaryItems": [{"Name":"mock_data_source", "Id": "mock_data_source_id"}]}
        self.kendra_client_mock.describe_data_source.return_value = {"Status":"FAILED"}

        response = handler(MagicMock, MagicMock())
        self.assertEqual("mock_kendra_index", response.get('IndexId'))
        self.assertEqual("mock_data_source_id", response.get('DataSourceId'))
        self.kendra_client_mock.update_data_source.assert_called()
        self.kendra_client_mock.start_data_source_sync_job.assert_not_called()
        with self.assertRaisesRegex(Exception, "ResourceNotFound"):
            self.cloudwatch_client.get_dashboard(DashboardName=os.environ.get('DASHBOARD_NAME'))
    
    def test_create_cron_expression(self):
        from kendra_webcrawler import create_cron_expression
        schedule = create_cron_expression("daily")
        assert schedule is not None
        self.assertEqual("", create_cron_expression(""))
        assert create_cron_expression("monthly") is not None
    
    def describe_data_source_mock(self, **kwargs):
        if self.counter == 0:
            self.counter += 1
            return {"Status":self.request_type}
        else:
            return {"Status":"ACTIVE"}
