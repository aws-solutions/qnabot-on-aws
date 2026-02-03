######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
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
dynamodb = boto3.client('dynamodb', config=sdk_config)

class CrawlerException(Exception):
    pass

def handler(event, context):  # NOSONAR Need these 2 params
    try:
        name = os.environ.get('DATASOURCE_NAME')
        settings = get_settings()
        index_id = settings.get('KENDRA_WEB_PAGE_INDEX')
        
        # Validate index_id format - Kendra index IDs should be at least 36 characters (UUID format)
        if not index_id or len(str(index_id)) < 36:
            logger.warning(f"Invalid or missing KENDRA_WEB_PAGE_INDEX: {index_id}. Kendra index may not be configured.")
            return {"Status": 'NOTCONFIGURED', "Message": "Kendra index not configured or invalid"}

        data_source_id = get_data_source_id(index_id, name)

        if data_source_id is None:
            return {"Status": 'NOTINDEXED'}
        else:
            return kendra_list_data_source_sync_jobs(index_id, data_source_id)
    except Exception as e:
        logger.error(f"Error in handler: {str(e)}")
        sys.tracebacklimit = 0
        raise CrawlerException('Exception: Failed to process this request. Please check the lambda logs for more further details.')


def get_settings():
    dynamodb = boto3.client('dynamodb')
    settings = {}
    
    try:
        paginator = dynamodb.get_paginator('scan')
        pages = paginator.paginate(
            TableName=os.environ['SETTINGS_TABLE']
        )

        items = []
        for page in pages:
            items.extend(page['Items'])
        
    except ClientError as error:
        logger.error(f"Error scanning settings table: {error}")
        raise error
    
    for item in items:
        setting_name = item['SettingName']['S']
        setting_value = item['SettingValue'].get('S') or item['SettingValue'].get('N')
        default_value = item['DefaultValue'].get('S') or item['DefaultValue'].get('N')
        
        # Use setting_value if not empty, otherwise use default_value
        final_value = setting_value if setting_value is not None else default_value
        settings[setting_name] = final_value
    
    return settings

def get_data_source_id(index_id, data_source_name):
    if not index_id or len(str(index_id)) < 36:
        logger.warning(f"Invalid index_id provided: {index_id}")
        return None
    
    try:
        response = client.list_data_sources(IndexId=index_id, MaxResults=5)
        for item in response['SummaryItems']:
            if item['Name'] == data_source_name:
                return item['Id']
        return None
    except ClientError as e:
        logger.error(f"Error listing data sources for index {index_id}: {str(e)}")
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


