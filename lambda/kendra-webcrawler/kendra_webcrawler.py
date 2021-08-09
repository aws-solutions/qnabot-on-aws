import boto3
import os
import json


client = boto3.client('kendra')

def handler(event, context):
    Name = os.environ.get('DATASOURCE_NAME')
    Type = 'WEBCRAWLER'
    RoleArn = os.environ.get('ROLE_ARN')
    Description = 'QnABot WebCrawler Index'
    IndexId = event['req']['_settings']['KENDRA_WEB_PAGE_INDEX']
    URLs = event['req']['_settings']['KENDRA_INDEXER_URLS'].replace(' ','').split(',')
    data_source_id = get_data_source_id(IndexId, Name)

    if data_source_id == None:
        data_source_id = kendra_create_data_source(client, IndexId, Name, Type, RoleArn, Description, URLs);
        kendra_sync_data_source(IndexId, data_source_id);
    else:
        kendra_update_data_source(IndexId, data_source_id, URLs);
        kendra_sync_data_source(IndexId, data_source_id);

def get_data_source_id(index_id, data_source_name):
    response = client.list_data_sources(
    IndexId=index_id,
    MaxResults=5
    )

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

if __name__ == "__main__":    

    handler(event, None);


