import boto3
import os
import json

client = boto3.client('kendra')
ssm = boto3.client('ssm')

def handler(event, context):
    Name = os.environ.get('DATASOURCE_NAME')
    Type = 'WEBCRAWLER'
    RoleArn = os.environ.get('ROLE_ARN')
    Description = 'QnABot WebCrawler Index'

    settings = get_settings()
    IndexId = settings['KENDRA_WEB_PAGE_INDEX']
    URLs = settings['KENDRA_INDEXER_URLS'].replace(' ','').split(',')
    data_source_id = get_data_source_id(IndexId, Name)

    if data_source_id == None:
        data_source_id = kendra_create_data_source(client, IndexId, Name, Type, RoleArn, Description, URLs);
        kendra_sync_data_source(IndexId, data_source_id);
    else:
        kendra_update_data_source(IndexId, data_source_id, URLs);
        kendra_sync_data_source(IndexId, data_source_id);

def get_settings():
    default_settings_key = os.environ.get("DEFAULT_SETTINGS_PARAM")
    custom_settings_key = os.environ.get("CUSTOM_SETTINGS_PARAM")

    default_settings = ssm.get_parameter(Name=default_settings_key, WithDecryption=True)
    custom_settings = ssm.get_parameter(Name=custom_settings_key, WithDecryption=True)
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

def kendra_create_data_source(client, IndexId, Name, Type, RoleArn, Description, URLs):
    response = client.create_data_source(
    Name=Name,
    IndexId=IndexId,
    Type=Type,
    RoleArn=RoleArn,
    Description=Description,
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
    return response['Id']

def kendra_sync_data_source(IndexId, data_source_id):
    response = client.start_data_source_sync_job(
    Id=data_source_id,
    IndexId=IndexId
    )
    print(json.dumps(response))
    return response

def kendra_update_data_source(IndexId, data_source_id, URLs):
    response = client.update_data_source(
    Id=data_source_id,
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

def kendra_list_data_source_sync_jobs(IndexId, data_source_id):
    response = client.list_data_source_sync_jobs(
        Id = data_source_id,
        IndexId= IndexId,
    )

    result = list(map(lambda item: {'StartTime': item['StartTime'], 
                                'EndTime': item['EndTime'],
                                'Status': item['Status'],
                                'ErrorMessage': item['ErrorMessage'],
                                'Metrics': item['Metrics']
                                }, response['History']))


if __name__ == "__main__":    

    handler(event, None);


