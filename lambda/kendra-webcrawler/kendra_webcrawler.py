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
    os.environ['DATASOURCE_NAME'] = 'QnABotWebCrawler-ajdflkajsdlfjoweiofjad5'
    os.environ['ROLE_ARN'] = 'arn:aws:iam::' + boto3.client('sts').get_caller_identity().get('Account') + ':role/service-role/AmazonKendra-us-east-1-kendra'
    
    event = {
    "req": {
        "_event": {
            "messageVersion": "1.0",
            "invocationSource": "FulfillmentCodeHook",
            "userId": "us-east-1:21415e20-735c-43ee-9f1a-f8e60cfe41cf",
            "sessionAttributes": {
                "connect_nextPrompt": "",
                "qnabot_qid": "AWS.Services.Quotas.ES",
                "qnabot_gotanswer": "True",
                "qnabotcontext": "{\"userLocale\":\"en\",\"previous\":{\"qid\":\"AWS.Services.Quotas.ES\",\"q\":\"what are the service quotas\"},\"navigation\":{\"next\":\"\",\"previous\":[],\"hasParent\":True}}",
                "QNAClientFilter": "es",
                "localTimeZone": "America/New_York",
                "userDetectedLocaleConfidence": "0.9601916670799255",
                "userDetectedLocale": "en"
            },
            "requestAttributes": None,
            "bot": {
                "name": "QNA_clientfilter_dev_master_two_BotSUAYM",
                "alias": "live",
                "version": "1"
            },
            "outputDialogMode": "Text",
            "currentIntent": {
                "name": "fulfilment_IntentsHVjCBTfAb",
                "slots": {
                    "slot": "what are the service quotas of kendra"
                },
                "slotDetails": {
                    "slot": {
                        "resolutions": [],
                        "originalValue": "what are the service quotas of kendra"
                    }
                },
                "confirmationStatus": "None",
                "nluIntentConfidenceScore": None
            },
            "alternativeIntents": [],
            "inputTranscript": "what are the service quotas of kendra",
            "recentIntentSummaryView": [
                {
                    "intentName": "fulfilment_IntentsHVjCBTfAb",
                    "checkpointLabel": None,
                    "slots": {
                        "slot": "what are the service quotas"
                    },
                    "confirmationStatus": "None",
                    "dialogActionType": "Close",
                    "fulfillmentState": "Fulfilled",
                    "slotToElicit": None
                },
                {
                    "intentName": "qnabotfallbackfulfilment_IntentOrXsYFaMb",
                    "checkpointLabel": None,
                    "slots": {},
                    "confirmationStatus": "None",
                    "dialogActionType": "Close",
                    "fulfillmentState": "Fulfilled",
                    "slotToElicit": None
                },
                {
                    "intentName": "fulfilment_IntentsHVjCBTfAb",
                    "checkpointLabel": None,
                    "slots": {
                        "slot": "how much does it cost again"
                    },
                    "confirmationStatus": "None",
                    "dialogActionType": "Close",
                    "fulfillmentState": "Fulfilled",
                    "slotToElicit": None
                }
            ],
            "sentimentResponse": None,
            "kendraResponse": None,
            "origQuestion": "what are the service quotas of kendra",
            "errorFound": False
        },
        "_settings": {
            "ENABLE_DEBUG_RESPONSES": False,
            "ES_USE_KEYWORD_FILTERS": True,
            "ES_EXPAND_CONTRACTIONS": "{\"you're\":\"you are\",\"I'm\":\"I am\",\"can't\":\"cannot\"}",
            "ES_KEYWORD_SYNTAX_TYPES": "NOUN,PROPN,VERB,INTJ",
            "ES_SYNTAX_CONFIDENCE_LIMIT": ".20",
            "ES_MINIMUM_SHOULD_MATCH": "2<75%",
            "ES_NO_HITS_QUESTION": "no_hits",
            "ES_USE_FUZZY_MATCH": False,
            "ES_ENABLE_CLIENT_FILTERS": True,
            "ES_PHRASE_BOOST": "4",
            "ES_SCORE_ANSWER_FIELD": False,
            "ENABLE_SENTIMENT_SUPPORT": True,
            "ENABLE_MULTI_LANGUAGE_SUPPORT": True,
            "ENABLE_CUSTOM_TERMINOLOGY": False,
            "MINIMUM_CONFIDENCE_SCORE": 0.6,
            "ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE": "HIGH",
            "ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE": "HIGH",
            "ALT_SEARCH_KENDRA_INDEXES": "",
            "ALT_SEARCH_KENDRA_S3_SIGNED_URLS": True,
            "ALT_SEARCH_KENDRA_S3_SIGNED_URL_EXPIRE_SECS": 300,
            "ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT": 2,
            "ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE": "Amazon Kendra suggested answer.",
            "ALT_SEARCH_KENDRA_FAQ_MESSAGE": "Answer from Amazon Kendra FAQ.",
            "ALT_SEARCH_KENDRA_ANSWER_MESSAGE": "While I did not find an exact answer, these search results from Amazon Kendra might be helpful.",
            "KENDRA_FAQ_INDEX": "",
            "KENDRA_FAQ_CONFIG_MAX_RETRIES": 8,
            "KENDRA_FAQ_CONFIG_RETRY_DELAY": 600,
            "KENDRA_FAQ_ES_FALLBACK": True,
            "ENABLE_KENDRA_WEB_INDEXER": False,
            "KENDRA_INDEXER_URLS": "https://aws.amazon.com/sagemaker/faqs/, https://aws.amazon.com/lex/faqs/, https://aws.amazon.com/kendra/faqs/",
            "KENDRA_INDEXER_SCHEDULE": "rate(1 day)",
            "KENDRA_WEB_PAGE_INDEX": "c937bd9b-5458-4d9e-aeff-13125ffede31",
            "ERRORMESSAGE": "Unfortunately I encountered an error when searching for your answer. Please ask me again later.",
            "EMPTYMESSAGE": "You stumped me! Sadly, I do not know how to answer your question.",
            "DEFAULT_ALEXA_LAUNCH_MESSAGE": "Hello, Please ask a question",
            "DEFAULT_ALEXA_REPROMPT": "Please either answer the question, ask another question or say Goodbye to end the conversation.",
            "DEFAULT_ALEXA_STOP_MESSAGE": "Goodbye",
            "SMS_HINT_REMINDER_ENABLE": True,
            "SMS_HINT_REMINDER": " (Feedback? Reply THUMBS UP or THUMBS DOWN. Ask HELP ME at any time)",
            "SMS_HINT_REMINDER_INTERVAL_HRS": "24",
            "IDENTITY_PROVIDER_JWKS_URLS": [],
            "ENFORCE_VERIFIED_IDENTITY": False,
            "NO_VERIFIED_IDENTITY_QUESTION": "no_verified_identity",
            "ELICIT_RESPONSE_MAX_RETRIES": 3,
            "ELICIT_RESPONSE_RETRY_MESSAGE": "Please try again?",
            "ELICIT_RESPONSE_BOT_FAILURE_MESSAGE": "Your response was not understood. Please start again.",
            "ELICIT_RESPONSE_DEFAULT_MSG": "Ok. ",
            "CONNECT_IGNORE_WORDS": "",
            "CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT": False,
            "CONNECT_NEXT_PROMPT_VARNAME": "connect_nextPrompt",
            "ENABLE_REDACTING": False,
            "REDACTING_REGEX": "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b",
            "PII_REJECTION_ENABLED": False,
            "PII_REJECTION_QUESTION": "pii_rejection_question",
            "PII_REJECTION_WITH_COMPREHEND": True,
            "PII_REJECTION_REGEX": "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b",
            "PII_REJECTION_IGNORE_TYPES": "Name,Address",
            "DISABLE_CLOUDWATCH_LOGGING": False,
            "MINIMAL_ES_LOGGING": False,
            "S3_PUT_REQUEST_ENCRYPTION": "",
            "BOT_ROUTER_WELCOME_BACK_MSG": "Welcome back to QnABot.",
            "BOT_ROUTER_EXIT_MSGS": "exit,quit,goodbye,leave",
            "RUN_LAMBDAHOOK_FROM_QUERY_STEP": True,
            "DEFAULT_USER_POOL_JWKS_URL": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_vmu4Vc2nV/.well-known/jwks.json"
        },
        "_type": "LEX",
        "_lexVersion": "V1",
        "_userId": "us-east-1:21415e20-735c-43ee-9f1a-f8e60cfe41cf",
        "question": "what are the service quotas of kendra",
        "session": {
            "connect_nextPrompt": "",
            "qnabot_qid": "AWS.Services.Quotas.ES",
            "qnabot_gotanswer": True,
            "qnabotcontext": {
                "userLocale": "en",
                "previous": {
                    "qid": "AWS.Services.Quotas.ES",
                    "q": "what are the service quotas"
                },
                "navigation": {
                    "next": "",
                    "previous": [],
                    "hasParent": True
                }
            },
            "QNAClientFilter": "es",
            "localTimeZone": "America/New_York",
            "userDetectedLocaleConfidence": 0.9781001806259155,
            "userDetectedLocale": "en"
        },
        "_preferredResponseType": "PlainText",
        "_clientType": "LEX.LexWebUI.Text",
        "sentiment": "NEUTRAL",
        "sentimentScore": {
            "Positive": 0.0051361992955207825,
            "Negative": 0.12248338013887405,
            "Neutral": 0.8705547451972961,
            "Mixed": 0.0018256634939461946
        },
        "_userInfo": {
            "UserId": "us-east-1:21415e20-735c-43ee-9f1a-f8e60cfe41cf",
            "InteractionCount": 71,
            "FirstSeen": "Tue Jul 27 2021 23:49:59 GMT+0000 (Coordinated Universal Time)",
            "LastSeen": "Tue Aug 03 2021 13:38:54 GMT+0000 (Coordinated Universal Time)",
            "TimeSinceLastInteraction": 13.466,
            "recentTopics": [
                {
                    "dateTime": "2021-08-03T13:36:50.807Z",
                    "topic": "cost"
                }
            ],
            "isVerifiedIdentity": "False"
        },
        "_info": {
            "es": {
                "address": "search-qna-cli-elasti-1u11e53056s7f-rdtwn2cbav5w7xuezpadogqvdq.us-east-1.es.amazonaws.com",
                "index": "qna-clientfilter-dev-master-2",
                "type": "qna",
                "service": {
                    "qid": "QNA-clientfilter-dev-master-2-ESQidLambda-Co3ElKkEGavs",
                    "proxy": "QNA-clientfilter-dev-master-2-ESProxyLambda-zIaMwGBPj0dm"
                }
            }
        }
    },
    "res": {
        "type": "PlainText",
        "message": "The Service Quotas for Elasticsearch can be found **[here](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-limits.html)**. For example, the number of dedicated master instances per domain is 5**.",
        "session": {
            "connect_nextPrompt": "",
            "qnabot_qid": "AWS.Services.Quotas.ES",
            "qnabot_gotanswer": "True",
            "qnabotcontext": "{\"userLocale\":\"en\",\"previous\":{\"qid\":\"AWS.Services.Quotas.ES\",\"q\":\"what are the service quotas of kendra\"},\"navigation\":{\"next\":\"\",\"previous\":[],\"hasParent\":True}}",
            "QNAClientFilter": "es",
            "localTimeZone": "America/New_York",
            "userDetectedLocaleConfidence": "0.9781001806259155",
            "userDetectedLocale": "en",
            "appContext": "{\"altMessages\":{\"markdown\":\"The Service Quotas for Elasticsearch can be found **[here](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-limits.html)**. For example, **the number of dedicated master instances per domain is 5**.\"}}"
        },
        "card": {
            "send": False,
            "title": "",
            "text": "",
            "url": "",
            "buttons": []
        },
        "_userInfo": {
            "UserId": "us-east-1:21415e20-735c-43ee-9f1a-f8e60cfe41cf",
            "InteractionCount": 72,
            "FirstSeen": "Tue Jul 27 2021 23:49:59 GMT+0000 (Coordinated Universal Time)",
            "LastSeen": "Tue Aug 03 2021 13:39:07 GMT+0000 (Coordinated Universal Time)",
            "TimeSinceLastInteraction": 13.466,
            "recentTopics": [
                {
                    "dateTime": "2021-08-03T13:36:50.807Z",
                    "topic": "cost"
                }
            ],
            "isVerifiedIdentity": "False"
        },
        "got_hits": 1,
        "result": {
            "qid": "AWS.Services.Quotas.ES",
            "quniqueterms": " What is the service quota? What are the service quotas for ElasticSearch?  ",
            "questions": [
                {
                    "q": "What is the service quota?"
                },
                {
                    "q": "What are the service quotas for ElasticSearch?"
                }
            ],
            "a": "The Service Quotas for Elasticsearch can be found **[here](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-limits.html)**. For example, the number of dedicated master instances per domain is 5**.",
            "alt": {
                "markdown": "The Service Quotas for Elasticsearch can be found **[here](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-limits.html)**. For example, **the number of dedicated master instances per domain is 5**."
            },
            "clientFilterValues": "es",
            "type": "qna",
            "answersource": "ElasticSearch",
            "autotranslate": {
                "a": True,
                "alt": {
                    "markdown": True
                },
                "rp": True
            },
            "rp": "Please either answer the question, ask another question or say Goodbye to end the conversation.",
            "l": "",
            "args": []
        },
        "plainMessage": "The Service Quotas for Elasticsearch can be found **[here](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-limits.html)**. For example, the number of dedicated master instances per domain is 5**.",
        "answerSource": "ELASTICSEARCH",
        "reprompt": {
            "type": "PlainText",
            "text": "Please either answer the question, ask another question or say Goodbye to end the conversation."
        },
        "out": {
            "sessionAttributes": {
                "connect_nextPrompt": "",
                "qnabot_qid": "AWS.Services.Quotas.ES",
                "qnabot_gotanswer": "True",
                "qnabotcontext": "{\"userLocale\":\"en\",\"previous\":{\"qid\":\"AWS.Services.Quotas.ES\",\"q\":\"what are the service quotas of kendra\"},\"navigation\":{\"next\":\"\",\"previous\":[],\"hasParent\":True}}",
                "QNAClientFilter": "es",
                "localTimeZone": "America/New_York",
                "userDetectedLocaleConfidence": "0.9781001806259155",
                "userDetectedLocale": "en",
                "appContext": "{\"altMessages\":{\"markdown\":\"The Service Quotas for Elasticsearch can be found **[here](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-limits.html)**. For example, **the number of dedicated master instances per domain is 5**.\"}}"
            },
            "dialogAction": {
                "type": "Close",
                "fulfillmentState": "Fulfilled",
                "message": {
                    "contentType": "PlainText",
                    "content": "The Service Quotas for Elasticsearch can be found **[here](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/aes-limits.html)**. For example, the number of dedicated master instances per domain is 5**."
                }
            }
        }
    }
}
    handler(event, None);


