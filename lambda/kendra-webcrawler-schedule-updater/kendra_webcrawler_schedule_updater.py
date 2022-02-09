import os
import json
import boto3
import re
import datetime
import calendar
import logging

kendra = boto3.client('kendra')
ssm = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')
logger = logging.getLogger().setLevel(logging.INFO)


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
        logger.warn("The schedule must be specified as either rate(day(s) | week(s) | month(s)) or daily | weekly | monthly")
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
    logger.info("cron schedule = " + cron)
    return cron


def handler(event, context):
    print(event)
    Name = os.environ.get('DATASOURCE_NAME')
    RoleArn = os.environ.get('ROLE_ARN')

    settings = get_settings()
    IndexId = settings['KENDRA_WEB_PAGE_INDEX']
    URLs = settings['KENDRA_INDEXER_URLS'].replace(' ', '').split(',')
    schedule = settings["KENDRA_INDEXER_SCHEDULE"]
    crawl_depth = settings["KENDRA_INDEXER_CRAWL_DEPTH"]

    schedule = create_cron_expression(schedule)
    if schedule == "INVALID":
        logger.warn("The cron schedule specified by KENDRA_INDEXER_SCHEDULE " +
                     "is invalid. Schedule: ${schedule}. Crawling will not be done on a schedule/")
        schedule = ""      
    data_source_id = get_data_source_id(IndexId, Name)
    current_schedule = get_data_source_schedule(IndexId, data_source_id)

    schedule_parts = schedule.replace("cron(", "").replace(")", "").split(" ")
    current_schedule_parts = current_schedule.replace("cron(", "").replace(")", "").split(" ")
 
    #The hour and minute are set dynamically.  This is to detect if the schedule changed between DAILY, WEEKLY, MONTHLY
    if(not (schedule_parts[2] != current_schedule_parts[2] or
       schedule_parts[3] != current_schedule_parts[3] or
      ((schedule_parts[3] != current_schedule_parts[3]) and (schedule_parts[3] != "?" or current_schedule_parts[3] != "?")))):
       
        logger.info("No schedule changes detected.  Not updating schedulr")
        schedule = current_schedule

    logger.info("Updating index with schedule " + schedule + " crawl_depth" + crawl_depth)
    kendra_update_data_source(IndexId, data_source_id, URLs, RoleArn, schedule, crawl_depth)

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
    response = kendra.list_data_sources(
        IndexId=index_id,
        MaxResults=5
    )

    # filtered = filter(lambda item: item['Name'] == data_source_name, response['SummaryItems'])
    for item in response['SummaryItems']:
        if item['Name'] == data_source_name:
            return item['Id']
    return None


def get_data_source_schedule(IndexId, datasource_id):
    response = kendra.describe_data_source(Id=datasource_id, IndexId=IndexId)
    return response["Schedule"]


def kendra_update_data_source(IndexId, data_source_id, URLs, RoleArn, schedule, crawl_depth):
    response = kendra.update_data_source(
        Id=data_source_id,
        RoleArn=RoleArn,
        Schedule=schedule,
        IndexId=IndexId,
        Configuration={
            'WebCrawlerConfiguration': {
                'Urls': {
                    'SeedUrlConfiguration': {
                        'SeedUrls': URLs,
                        'WebCrawlerMode': 'EVERYTHING'
                    }
                },
                'CrawlDepth': int(crawl_depth)
            }
        }
    )
    return response
