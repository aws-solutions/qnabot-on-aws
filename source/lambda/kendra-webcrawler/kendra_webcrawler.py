
######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import os
import json
import boto3
import re
import datetime
import calendar
import logging
import time
from botocore.config import Config
from botocore.exceptions import ClientError

sdk_config = Config(user_agent_extra = f"AWSSOLUTION/{os.environ['SOLUTION_ID']}/{os.environ['SOLUTION_VERSION']} AWSSOLUTION-CAPABILITY/{os.environ['SOLUTION_ID']}-C007/{os.environ['SOLUTION_VERSION']}")


client = boto3.client('kendra', config=sdk_config)
ssm = boto3.client('ssm', config=sdk_config)
cloudwatch = boto3.client('cloudwatch', config=sdk_config)


def create_cron_expression(schedule):
    rate_regex = r"(rate\()(\d\s(?:day|week|month)s?)(\))"
    match = re.match(rate_regex, schedule)
    if match is not None:
        schedule = match.group(2)
        unit = schedule.split(" ")[1]
    elif schedule in ["daily", "weekly", "monthly"]:
        unit = schedule
    elif schedule is None or schedule == "":
        return ""
    else:
        return "INVALID"

    now = datetime.datetime.now()
    cron = [None] * 6
    cron[0] = now.minute
    cron[1] = now.hour
    cron[2] = now.day if now.day < 27 else 27
    cron[3] = now.month
    cron[4] = calendar.day_name[datetime.datetime.today().weekday()][0:3].upper()
    cron[5] = "*"

    if unit in ["day", "days", "daily"]:
        cron[2] = "*"
        cron[3] = "*"
        cron[4] = "?"

    if unit in ["week", "weeks", "weekly"]:
        cron[2] = "?"
        cron[3] = "*"

    if unit in ["month", "months", "monthly"]:
        cron[3] = "*"
        cron[4] = "?"

    cron = "cron(" + " ".join(map(lambda i: str(i), cron)) + ")"
    print(cron)
    return cron

"""
function describe_data_source
this function provides information about a Kendra index data source
the function returns the {status} attribute for a given data source in a Kendra index
"""
def describe_data_source (data_source_id, index_id):
    response = client.describe_data_source(
        Id=data_source_id,
        IndexId=index_id
    )
    data_source_status = response["Status"]

    return data_source_status


"""
function get_data_source_status
this function polls describe_data_source to get the latest information on the {status}
the function returns the latest value for the {status} attribute for a given data source in a Kendra index
"""
def get_data_source_status (data_source_id, index_id):
    data_source_status = describe_data_source (data_source_id, index_id)
    while data_source_status in ["CREATING", "UPDATING"]:   #checking for the data source status
        time.sleep (5)  #wait for 5 seconds and check status again
        data_source_status = describe_data_source (data_source_id, index_id)

    return data_source_status


def handler(event, context):  # NOSONAR Lambda handler
    logging.info(event)

    name = os.environ.get('DATASOURCE_NAME')
    role_arn = os.environ.get('ROLE_ARN')
    res_type = 'WEBCRAWLER'
    description = 'QnABot WebCrawler Index'

    settings = get_settings()
    index_id = settings['KENDRA_WEB_PAGE_INDEX']
    urls = settings['KENDRA_INDEXER_URLS'].replace(' ', '').split(',')
    schedule = settings["KENDRA_INDEXER_SCHEDULE"]
    crawler_mode = settings["KENDRA_INDEXER_CRAWL_MODE"].upper()
    crawl_depth = settings["KENDRA_INDEXER_CRAWL_DEPTH"]
    language = kendra_supported_languages(settings["NATIVE_LANGUAGE"])

    schedule = create_cron_expression(schedule)
    if schedule == "INVALID":
        schedule = ""
    data_source_id = get_data_source_id(index_id, name)

    if data_source_id is None:
        data_source_id = kendra_create_data_source(client, index_id, name, res_type, role_arn, description, urls, schedule, crawler_mode, crawl_depth, language)
        data_source_status = get_data_source_status (data_source_id, index_id) # get current status of the data source
        if data_source_status == 'ACTIVE':  #if the data source status is ACTIVE, then proceed to initiate a data source sync, and also create a Cloudwatch dashboard
            kendra_sync_data_source(index_id, data_source_id)    #sync data source
            create_dashboard(index_id, data_source_id)   #create Cloudwatch dashboard
        else:
            logging.info ("The Kendra WebCrawler data source: " + name + " is in: " + data_source_status + " status.")
            logging.info ("Kendra data source sync, and Cloudwatch dashboard creation step was skipped for the Kendra Index.")
    else:
        kendra_update_data_source(index_id, data_source_id, urls, role_arn, schedule, crawler_mode, crawl_depth, language)
        data_source_status = get_data_source_status (data_source_id, index_id) # get current status of the data source
        if data_source_status == 'ACTIVE':  #if the data source status is ACTIVE, then proceed to initiate a data source sync, and also create a Cloudwatch dashboard
            kendra_sync_data_source(index_id, data_source_id)    #sync data source
        else:
            logging.info ("The Kendra WebCrawler data source: " + name + " is in: " + data_source_status + " status.")
            logging.info ("Kendra data source sync update step was skipped for the Kendra Index.")

    return {"IndexId": index_id, "DataSourceId": data_source_id}


def get_settings():
    print(f"Checking for QnABot Settings in DynamoDB Table: {os.environ['SETTINGS_TABLE']}")
    
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
        print(f"Error: {error}")
        raise error
    
    for item in items:
        setting_name = item['SettingName']['S']
        setting_value = item['SettingValue'].get('S') or item['SettingValue'].get('N')
        default_value = item['DefaultValue'].get('S') or item['DefaultValue'].get('N')
        
        # Use setting_value if not empty, otherwise use default_value
        settings[setting_name] = setting_value if setting_value is not None else default_value

    return settings


def get_data_source_id(index_id, data_source_name):
    response = client.list_data_sources(
        IndexId=index_id,
        MaxResults=5
    )

    for item in response['SummaryItems']:
        if item['Name'] == data_source_name:
            return item['Id']
    return None


def kendra_create_data_source(client, index_id, name, type, role_arn, description, urls, schedule, crawler_mode,crawl_depth, language):
    response = client.create_data_source(
        Name=name,
        IndexId=index_id,
        Type=type,
        RoleArn=role_arn,
        Description=description,
        Schedule=schedule,
        Configuration={
            'WebCrawlerConfiguration': {
                'Urls': {
                    'SeedUrlConfiguration': {
                        'SeedUrls': urls,
                        'WebCrawlerMode': crawler_mode
                    }
                },
                'CrawlDepth': int(crawl_depth),
                'MaxLinksPerPage': 100,
                'MaxContentSizePerPageInMegaBytes': 50.0,
                'MaxUrlsPerMinuteCrawlRate': 300
            }
        },
        LanguageCode=language
    )
    return response['Id']


def kendra_sync_data_source(index_id, data_source_id):
    response = client.start_data_source_sync_job(
        Id=data_source_id,
        IndexId=index_id
    )

    return response


def kendra_update_data_source(index_id, data_source_id, urls, role_arn, schedule, crawler_mode,crawl_depth, language):
    response = client.update_data_source(
        Id=data_source_id,
        RoleArn=role_arn,
        Schedule=schedule,
        IndexId=index_id,
        Configuration={
            'WebCrawlerConfiguration': {
                'Urls': {
                    'SeedUrlConfiguration': {
                        'SeedUrls': urls,
                        'WebCrawlerMode': crawler_mode
                    }
                },
                'CrawlDepth': int(crawl_depth),
                'MaxLinksPerPage': 100,
                'MaxContentSizePerPageInMegaBytes': 50.0,
                'MaxUrlsPerMinuteCrawlRate': 300
            }
        },
        LanguageCode=language
    )
    return response


def create_dashboard(index_id, data_source_id):

    cwd = os.environ['LAMBDA_TASK_ROOT']
    file_path = os.path.join(cwd, 'kendra-dashboard.json')

    with open(file_path, 'r') as dashboard:
        dashboard_body = dashboard.read()

    dashboard_body = dashboard_body.replace('${IndexId}', index_id)
    dashboard_body = dashboard_body.replace('${data_source_id}', data_source_id)
    dashboard_body = dashboard_body.replace('${Region}', os.environ['AWS_REGION'])
    dashboard_body = dashboard_body.replace('\n', '')

    cloudwatch.put_dashboard(
        DashboardName=os.environ.get('DASHBOARD_NAME'),
        DashboardBody=dashboard_body
    )

def kendra_supported_languages(language):
    supported_languages = {"Arabic": "ar",
    "Armenian": 'hy',
    "Basque": 'eu',
    "Bengali": 'bn',
    "Brazilian": 'pt-BR',
    "Bulgarian": 'bg',
    "Catalan": 'ca',
    "Chinese": 'zh',
    "Czech": 'cs',
    "Danish": 'da',
    "Dutch": 'nl',
    "English": 'en',
    "French": 'fr',
    "Galician": 'gr',
    "German": 'de',
    "Greek": 'el',
    "Hindi": 'hi',
    "Hungarian": 'hu',
    "Indonesian": 'id',
    "Irish": 'ga',
    "Italian": 'it',
    "Japanese": 'ja',
    "Korean": 'ko',
    "Latvian": 'lv',
    "Lithuanian": 'lt',
    "Norwegian": 'no',
    "Persian": 'fa',
    "Portuguese": 'pt',
    "Romanian": 'ro',
    "Russian": 'ru',
    "Sorani": 'ckb',
    "Spanish": 'es',
    "Swedish": 'sv',
    "Turkish": 'tr', }
    mapping = supported_languages.get(language)

    if(mapping):
        return mapping
    else:
        return 'en'