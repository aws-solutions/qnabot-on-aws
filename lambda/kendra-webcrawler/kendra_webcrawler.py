import os
import json
import boto3
import re
import datetime
import calendar
import logging
import time

client = boto3.client('kendra')
ssm = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')


def create_cron_expression(schedule):
    rate_regex = "(rate\()(\d\s(?:day|week|month)s?)(\))"
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
def describe_data_source (data_source_id, IndexId): 
    response = client.describe_data_source(
        Id=data_source_id,
        IndexId=IndexId
    )
    data_source_status = response["Status"]

    return data_source_status


"""
function get_data_source_status
this function polls describe_data_source to get the latest information on the {status}
the function returns the latest value for the {status} attribute for a given data source in a Kendra index
"""
def get_data_source_status (data_source_id, IndexId):
    data_source_status = describe_data_source (data_source_id, IndexId)
    while data_source_status in ["CREATING", "UPDATING"]:   #checking for the data source status
        time.sleep (5)  #wait for 5 seconds and check status again 
        data_source_status = describe_data_source (data_source_id, IndexId)
    
    return data_source_status


def handler(event, context):
    logging.info(event)

    Name = os.environ.get('DATASOURCE_NAME')
    RoleArn = os.environ.get('ROLE_ARN')
    Type = 'WEBCRAWLER'
    Description = 'QnABot WebCrawler Index'

    settings = get_settings()
    IndexId = settings['KENDRA_WEB_PAGE_INDEX']
    URLs = settings['KENDRA_INDEXER_URLS'].replace(' ', '').split(',')
    schedule = settings["KENDRA_INDEXER_SCHEDULE"]
    crawler_mode = settings["KENDRA_INDEXER_CRAWL_MODE"].upper()
    crawl_depth = settings["KENDRA_INDEXER_CRAWL_DEPTH"]

    schedule = create_cron_expression(schedule)
    if schedule == "INVALID":
        schedule = ""
    data_source_id = get_data_source_id(IndexId, Name)

    if data_source_id is None:
        data_source_id = kendra_create_data_source(client, IndexId, Name, Type, RoleArn, Description, URLs, schedule, crawler_mode, crawl_depth)
        data_source_status = get_data_source_status (data_source_id, IndexId) # get current status of the data source
        if data_source_status == 'ACTIVE':  #if the data source status is ACTIVE, then proceed to initiate a data source sync, and also create a Cloudwatch dashboard
            kendra_sync_data_source(IndexId, data_source_id)    #sync data source
            create_dashboard(IndexId, data_source_id)   #create Cloudwatch dashboard
        else:
            logging.info ("The Kendra WebCrawler data source: " + Name + " is in: " + data_source_status + " status.")
            logging.info ("Kendra data source sync, and Cloudwatch dashboard creation step was skipped for the Kendra Index.")
    else:
        kendra_update_data_source(IndexId, data_source_id, URLs, RoleArn, schedule, crawler_mode, crawl_depth)
        data_source_status = get_data_source_status (data_source_id, IndexId) # get current status of the data source
        if data_source_status == 'ACTIVE':  #if the data source status is ACTIVE, then proceed to initiate a data source sync, and also create a Cloudwatch dashboard
            kendra_sync_data_source(IndexId, data_source_id)    #sync data source
        else:
            logging.info ("The Kendra WebCrawler data source: " + Name + " is in: " + data_source_status + " status.")
            logging.info ("Kendra data source sync update step was skipped for the Kendra Index.")

    return {"IndexId": IndexId, "DataSourceId": data_source_id}


def get_settings():
    default_settings_key = os.environ.get("DEFAULT_SETTINGS_PARAM")
    custom_settings_key = os.environ.get("CUSTOM_SETTINGS_PARAM")

    default_settings = ssm.get_parameter(Name=default_settings_key, WithDecryption=True)
    default_settings = json.loads(default_settings['Parameter']['Value'])
    custom_settings = ssm.get_parameter(Name=custom_settings_key, WithDecryption=True)
    custom_settings = json.loads(custom_settings['Parameter']['Value'])
    default_settings.update(custom_settings)


    return default_settings


def get_data_source_id(index_id, data_source_name):
    response = client.list_data_sources(
        IndexId=index_id,
        MaxResults=5
    )

    # filtered = filter(lambda item: item['Name'] == data_source_name, response['SummaryItems'])
    for item in response['SummaryItems']:
        if item['Name'] == data_source_name:
            return item['Id']
    return None


def kendra_create_data_source(client, IndexId, Name, Type, RoleArn, Description, URLs, schedule, crawler_mode,crawl_depth):
    response = client.create_data_source(
        Name=Name,
        IndexId=IndexId,
        Type=Type,
        RoleArn=RoleArn,
        Description=Description,
        Schedule=schedule,
        Configuration={
            'WebCrawlerConfiguration': {
                'Urls': {
                    'SeedUrlConfiguration': {
                        'SeedUrls': URLs,
                        'WebCrawlerMode': crawler_mode
                    }
                },
                'CrawlDepth': int(crawl_depth), 
                'MaxLinksPerPage': 100, 
                'MaxContentSizePerPageInMegaBytes': 50.0, 
                'MaxUrlsPerMinuteCrawlRate': 300
            }
        }
    )
    return response['Id']


def kendra_sync_data_source(IndexId, data_source_id):
    response = client.start_data_source_sync_job(
        Id=data_source_id,
        IndexId=IndexId
    )

    return response


def kendra_update_data_source(IndexId, data_source_id, URLs, RoleArn, schedule, crawler_mode,crawl_depth):
    response = client.update_data_source(
        Id=data_source_id,
        RoleArn=RoleArn,
        Schedule=schedule,
        IndexId=IndexId,
        Configuration={
            'WebCrawlerConfiguration': {
                'Urls': {
                    'SeedUrlConfiguration': {
                        'SeedUrls': URLs,
                        'WebCrawlerMode': crawler_mode
                    }
                },
                'CrawlDepth': int(crawl_depth), 
                'MaxLinksPerPage': 100, 
                'MaxContentSizePerPageInMegaBytes': 50.0, 
                'MaxUrlsPerMinuteCrawlRate': 300
            }
        }
    )
    return response


def create_dashboard(IndexId, data_source_id):

    cwd = os.environ['LAMBDA_TASK_ROOT']
    file = os.path.join(cwd, 'kendra-dashboard.json')

    with open(file, 'r') as dashboard:
        dashboard_body = dashboard.read()

    dashboard_body = dashboard_body.replace('${IndexId}', IndexId)
    dashboard_body = dashboard_body.replace('${data_source_id}', data_source_id)
    dashboard_body = dashboard_body.replace('${Region}', os.environ['AWS_REGION'])
    dashboard_body = dashboard_body.replace('\n', '')

    cloudwatch.put_dashboard(
        DashboardName=os.environ.get('DASHBOARD_NAME'),
        DashboardBody=dashboard_body
    )

