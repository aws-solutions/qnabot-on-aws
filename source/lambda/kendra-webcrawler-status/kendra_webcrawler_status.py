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
import json
import sys
import boto3
import functools
import logging
from botocore.config import Config
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sdk_config = Config(user_agent_extra = f"AWSSOLUTION/{os.environ['SOLUTION_ID']}/{os.environ['SOLUTION_VERSION']} AWSSOLUTION-CAPABILITY/{os.environ['SOLUTION_ID']}-C007/{os.environ['SOLUTION_VERSION']}")

client = boto3.client('kendra', config=sdk_config)
ssm = boto3.client('ssm', config=sdk_config)

class CrawlerException(Exception):
    pass

def handler(event, handler):  # NOSONAR Need these 2 params
    try:
        name = os.environ.get('DATASOURCE_NAME')
        settings = get_settings()
        index_id = settings['KENDRA_WEB_PAGE_INDEX']

        data_source_id = get_data_source_id(index_id, name)

        if data_source_id is None:
            return {"Status": 'NOTINDEXED'}
        else:
            return kendra_list_data_source_sync_jobs(index_id, data_source_id)
    except Exception as e:
        logger.info(e)
        sys.tracebacklimit = 0
        raise CrawlerException('Exception: Failed to process this request. Please check the lambda logs for more further details.')


def get_settings():
    try:
        default_settings_key = os.environ.get("DEFAULT_SETTINGS_PARAM")
        private_settings_key = os.environ.get("PRIVATE_SETTINGS_PARAM")
        custom_settings_key = os.environ.get("CUSTOM_SETTINGS_PARAM")

        default_settings = ssm.get_parameter(Name=default_settings_key, WithDecryption=True)
        default_settings = json.loads(default_settings['Parameter']['Value'])
        private_settings = ssm.get_parameter(Name=private_settings_key, WithDecryption=True)
        private_settings = json.loads(private_settings['Parameter']['Value'])
        default_settings.update(private_settings)
        custom_settings = ssm.get_parameter(Name=custom_settings_key, WithDecryption=True)
        custom_settings = json.loads(custom_settings['Parameter']['Value'])
        default_settings.update(private_settings)
        default_settings.update(custom_settings)
        
        return default_settings
    except ClientError as e:
        message = e.response['Error']['Message']
        code = e.response['Error']['Code']
        logger.info(f"Error while getting settings {code}:{message}")
        raise e

def get_data_source_id(index_id, data_source_name):
    if not index_id:
        return None
    response = client.list_data_sources(IndexId=index_id, MaxResults=5)

    for item in response['SummaryItems']:
        if item['Name'] == data_source_name:
            return item['Id']
    return None


def kendra_list_data_source_sync_jobs(index_id, data_source_id):
    #get information about a Kendra index data source
    response = client.describe_data_source(
        Id=data_source_id,
        IndexId=index_id
    )
    data_source_status = response["Status"]

    #get information on the data sync jobs for a given data source
    response = client.list_data_source_sync_jobs(Id=data_source_id, IndexId=index_id)
    # get current status by sorting the result by start time descending order
    if response['History'] != []:   #if there is data sync history
        latest_history_item = functools.reduce(lambda x, y: x if x['StartTime'] > y['StartTime'] else y, response['History'])

        result = list(map(lambda item: {'StartTime': item['StartTime'].strftime("%m/%d/%Y, %H:%M:%S"),
                                    'EndTime': item['EndTime'].strftime("%m/%d/%Y, %H:%M:%S") if 'EndTime' in item else '',
                                    'Status': item['Status'] if item['Status'] != "INCOMPLETE" else "COMPLETE WITH ERRORS",
                                    'ErrorMessage': item['ErrorMessage'] if 'ErrorMessage' in item else '',
                                    'Metrics': item['Metrics']
                                    }, response['History']))
        status = latest_history_item['Status']
    else:
        result = ''
        status = data_source_status

    if data_source_status != 'ACTIVE':
        status = data_source_status

    response = {
                "Status": status,
                "History": result,
                "DashboardUrl": f'https://console.aws.amazon.com/cloudwatch/home?region={os.environ.get("AWS_REGION")}#dashboards:name={os.environ.get("DASHBOARD_NAME")}'
                }
    return response


