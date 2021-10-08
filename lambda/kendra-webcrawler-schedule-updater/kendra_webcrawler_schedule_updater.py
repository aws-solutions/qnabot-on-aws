import os
import json
import boto3
import re
import datetime
import calendar

client = boto3.client('kendra')
ssm = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')


def create_cron_expression(schedule):
    print(schedule)
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


def handler(event, context):
    Name = os.environ.get('DATASOURCE_NAME')
    RoleArn = os.environ.get('ROLE_ARN')

    settings = get_settings()
    IndexId = settings['KENDRA_WEB_PAGE_INDEX']
    URLs = settings['KENDRA_INDEXER_URLS'].replace(' ', '').split(',')
    schedule = settings["KENDRA_INDEXER_SCHEDULE"]

    schedule = create_cron_expression(schedule)
    if schedule == "INVALID":
        schedule = ""
        
    data_source_id = get_data_source_id(IndexId, Name)
    current_schedule = get_data_source_schedule(IndexId, data_source_id)

    schedule_parts = schedule.replace("cron(", "").replace(")", "").split(",")
    current_schedule = schedule.replace("cron(", "").replace(")", "").split(",")

    # The hour and minute are set dynamically.  This is to detect if the schedule changed between DAILY, WEEKLY, MONTHLY
    if(schedule_parts[2] != current_schedule[2] or
       schedule_parts[3] != current_schedule[3] or
       ((schedule_parts[3] != current_schedule[3]) and (schedule_parts[3] != "?" or current_schedule[3] != "?"))):

        kendra_update_data_source(IndexId, data_source_id, URLs, RoleArn, schedule)

    return {"IndexId": IndexId, "DataSourceId": data_source_id}


def get_settings():
    default_settings_key = os.environ.get("DEFAULT_SETTINGS_PARAM")
    custom_settings_key = os.environ.get("CUSTOM_SETTINGS_PARAM")

    default_settings = ssm.get_parameter(Name=default_settings_key, WithDecryption=True)
    default_settings = json.loads(default_settings['Parameter']['Value'])
    custom_settings = ssm.get_parameter(Name=custom_settings_key, WithDecryption=True)
    custom_settings = json.loads(custom_settings['Parameter']['Value'])
    default_settings.update(custom_settings)

    print(default_settings)
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


def get_data_source_schedule(IndexId, datasource_id):
    response = client.describe_data_source(Id=datasource_id, IndexId=IndexId)
    return response["Schedule"]

def kendra_update_data_source(IndexId, data_source_id, URLs, RoleArn, schedule):
    response = client.update_data_source(
        Id=data_source_id,
        RoleArn=RoleArn,
        Schedule= schedule,
        IndexId=IndexId,
        Configuration={
            'WebCrawlerConfiguration': {
                'Urls': {
                    'SeedUrlConfiguration': {
                        'SeedUrls': URLs,
                        'WebCrawlerMode': 'EVERYTHING'
                    }
                },
                'CrawlDepth': 2
            }
        }
    )
    print(json.dumps(response))
    return response


def create_dashboard(IndexId, data_source_id):

    cwd = os.environ['LAMBDA_TASK_ROOT']
    file = os.path.join(cwd, 'kendra-dashboard.json')

    with open(file, 'r') as dashboard:
        dashboard_body = dashboard.read()

    dashboard_body = dashboard_body.replace('${IndexId}', IndexId)
    dashboard_body = dashboard_body.replace('${data_source_id}', data_source_id)
    dashboard_body = dashboard_body.replace('\n', '')

    response = cloudwatch.put_dashboard(
        DashboardName=os.environ.get('DASHBOARD_NAME'),
        DashboardBody=dashboard_body
    )
    print(response)
