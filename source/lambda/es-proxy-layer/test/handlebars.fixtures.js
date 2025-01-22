/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.req = {
    '_event': {
        'inputMode': 'Text',
        'sessionId': 'us-east-1:1038b5e8-8856-49ba-9652-b7b98092472a',
        'inputTranscript': 'English',
        'interpretations': [
            {
                'interpretationSource': 'Lex',
                'nluConfidence': 0.91,
                'intent': {
                    'name': 'QnaIntent',
                    'slots': {
                        'qnaslot': {
                            'value': {
                                'originalValue': '',
                                'resolvedValues': [],
                                'interpretedValue': ''
                            },
                            'shape': 'Scalar'
                        }
                    },
                    'state': 'ReadyForFulfillment',
                    'confirmationState': 'None'
                }
            },
            {
                'interpretationSource': 'Lex',
                'intent': {
                    'name': 'FallbackIntent',
                    'slots': {},
                    'state': 'ReadyForFulfillment',
                    'confirmationState': 'None'
                }
            }
        ],
        'bot': {
            'name': 'QNA-dev-dev-master-4_QnaBot',
            'version': '4',
            'localeId': 'en_US',
            'id': 'E2O8THOA9A',
            'aliasId': 'ZCNW6BCPGS',
            'aliasName': 'live'
        },
        'responseContentType': 'text/plain; charset=utf-8',
        'sessionState': {
            'originatingRequestId': '48de0303-b8cb-4ae0-a396-1b2e80e4a732',
            'sessionAttributes': {
                'idtokenjwt': '<token redacted>'
            },
            'intent': {
                'name': 'QnaIntent',
                'slots': {
                    'qnaslot': {
                        'value': {
                            'originalValue': 'How can I publish Kindle books?',
                            'resolvedValues': [],
                            'interpretedValue': 'How can I publish Kindle books?'
                        },
                        'shape': 'Scalar'
                    }
                },
                'state': 'ReadyForFulfillment',
                'confirmationState': 'None'
            }
        },
        'messageVersion': '1.0',
        'invocationSource': 'FulfillmentCodeHook',
        'transcriptions': [
            {
                'resolvedContext': {
                    'intent': 'QnaIntent'
                },
                'resolvedSlots': {
                    'qnaslot': {
                        'value': {
                            'originalValue': 'How can I publish Kindle books?',
                            'resolvedValues': []
                        },
                        'shape': 'Scalar'
                    }
                },
                'transcriptionConfidence': 1,
                'transcription': 'How can I publish Kindle books?'
            }
        ],
        'origQuestion': 'How can I publish Kindle books?'
    },
    '_settings': {
        'ENABLE_DEBUG_RESPONSES': true,
        'ENABLE_DEBUG_LOGGING': false,
        'ES_USE_KEYWORD_FILTERS': true,
        'ES_EXPAND_CONTRACTIONS': '{"you\'re":"you are","I\'m":"I am","can\'t":"cannot"}',
        'ES_KEYWORD_SYNTAX_TYPES': 'NOUN,PROPN,VERB,INTJ',
        'ES_SYNTAX_CONFIDENCE_LIMIT': .20,
        'ES_MINIMUM_SHOULD_MATCH': '2<75%',
        'ES_NO_HITS_QUESTION': 'no_hits',
        'ES_ERROR_QUESTION': 'error_msg',
        'ES_USE_FUZZY_MATCH': false,
        'ES_PHRASE_BOOST': 4,
        'ES_SCORE_ANSWER_FIELD': false,
        'ES_SCORE_TEXT_ITEM_PASSAGES': false,
        'ENABLE_SENTIMENT_SUPPORT': true,
        'ENABLE_MULTI_LANGUAGE_SUPPORT': true,
        'ENABLE_CUSTOM_TERMINOLOGY': true,
        'MINIMUM_CONFIDENCE_SCORE': 0.6,
        'ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE': 'HIGH',
        'ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE': 'HIGH',
        'ALT_SEARCH_KENDRA_INDEXES': '2981840d-778f-47c0-8064-db4780f990c3',
        'ALT_SEARCH_KENDRA_S3_SIGNED_URLS': true,
        'ALT_SEARCH_KENDRA_S3_SIGNED_URL_EXPIRE_SECS': 300,
        'ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT': '1',
        'ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE': 'Amazon Kendra suggested answer.',
        'ALT_SEARCH_KENDRA_FAQ_MESSAGE': 'Answer from Amazon Kendra FAQ.',
        'ALT_SEARCH_KENDRA_ANSWER_MESSAGE':
            'While I did not find an exact answer, these search results from Amazon Kendra might be helpful.',
        'ALT_SEARCH_KENDRA_RESPONSE_TYPES': 'ANSWER,DOCUMENT,QUESTION_ANSWER',
        'ALT_SEARCH_KENDRA_ABBREVIATE_MESSAGE_FOR_SSML': true,
        'KENDRA_FAQ_INDEX': '2981840d-778f-47c0-8064-db4780f990c3',
        'KENDRA_FAQ_CONFIG_MAX_RETRIES': 8,
        'KENDRA_FAQ_CONFIG_RETRY_DELAY': 600,
        'KENDRA_FAQ_ES_FALLBACK': true,
        'ENABLE_KENDRA_WEB_INDEXER': true,
        'KENDRA_INDEXER_URLS': 'https://developer.amazon.com/en-US/alexa,https://www.amazon.com/s?k=kindle',
        'KENDRA_INDEXER_CRAWL_DEPTH': '2',
        'KENDRA_INDEXER_CRAWL_MODE': 'subdomains',
        'KENDRA_INDEXER_SCHEDULE': 'rate(1 day)',
        'KENDRA_WEB_PAGE_INDEX': '2981840d-778f-47c0-8064-db4780f990c3',
        'KENDRA_INDEXED_DOCUMENTS_LANGUAGES': 'en',
        'ERRORMESSAGE':
            'Unfortunately I encountered an error when searching for your answer. Please ask me again later.',
        'EMPTYMESSAGE': "Sorry, I don't know that",
        'DEFAULT_ALEXA_LAUNCH_MESSAGE': 'Hello, Please ask a question',
        'DEFAULT_ALEXA_REPROMPT':
            'Please either answer the question, ask another question or say Goodbye to end the conversation.',
        'DEFAULT_ALEXA_STOP_MESSAGE': 'Goodbye',
        'SMS_HINT_REMINDER_ENABLE': true,
        'SMS_HINT_REMINDER': ' (Feedback? Reply THUMBS UP or THUMBS DOWN. Ask HELP ME at any time)',
        'SMS_HINT_REMINDER_INTERVAL_HRS': 24,
        'IDENTITY_PROVIDER_JWKS_URLS': [],
        'ENFORCE_VERIFIED_IDENTITY': false,
        'NO_VERIFIED_IDENTITY_QUESTION': 'no_verified_identity',
        'ELICIT_RESPONSE_MAX_RETRIES': 3,
        'ELICIT_RESPONSE_RETRY_MESSAGE': 'Please try again.',
        'ELICIT_RESPONSE_BOT_FAILURE_MESSAGE': 'Your response was not understood. Please start again.',
        'ELICIT_RESPONSE_DEFAULT_MSG': 'Ok. ',
        'CONNECT_IGNORE_WORDS': '',
        'CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT': false,
        'CONNECT_NEXT_PROMPT_VARNAME': 'connect_nextPrompt',
        'ENABLE_REDACTING': false,
        'REDACTING_REGEX': '\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b',
        'ENABLE_REDACTING_WITH_COMPREHEND': false,
        'COMPREHEND_REDACTING_CONFIDENCE_SCORE': 0.99,
        'COMPREHEND_REDACTING_ENTITY_TYPES':
            'ADDRESS,EMAIL,SSN,PHONE,PASSWORD,BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER',
        'PII_REJECTION_ENABLED': false,
        'PII_REJECTION_QUESTION': 'pii_rejection_question',
        'PII_REJECTION_REGEX': '\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b',
        'PII_REJECTION_ENTITY_TYPES':
            'ADDRESS,EMAIL,SSN,PHONE,PASSWORD,BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER',
        'PII_REJECTION_CONFIDENCE_SCORE': 0.99,
        'DISABLE_CLOUDWATCH_LOGGING': false,
        'MINIMAL_ES_LOGGING': false,
        'S3_PUT_REQUEST_ENCRYPTION': '',
        'BOT_ROUTER_WELCOME_BACK_MSG': 'Welcome back to QnABot.',
        'BOT_ROUTER_EXIT_MSGS': 'exit,quit,goodbye,leave',
        'RUN_LAMBDAHOOK_FROM_QUERY_STEP': true,
        'LAMBDA_PREPROCESS_HOOK': '',
        'LAMBDA_POSTPROCESS_HOOK': '',
        'SEARCH_REPLACE_QUESTION_SUBSTRINGS': '',
        'PROTECTED_UTTERANCES':
            'help me,thumbs up,thumbs down,english,french,spanish,german,italian,chinese,arabic,greek',
        'EMBEDDINGS_ENABLE': false,
        'EMBEDDINGS_SCORE_THRESHOLD': 0.85,
        'EMBEDDINGS_SCORE_ANSWER_THRESHOLD': 0.8,
        'EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD': 0.8,
        'LLM_API': 'BEDROCK',
        'LLM_GENERATE_QUERY_ENABLE': false,
        'LLM_GENERATE_QUERY_PROMPT_TEMPLATE':
            'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.<br>Chat History: <br>{history}<br>Follow Up Input: {input}<br>Standalone question:',
        'LLM_GENERATE_QUERY_MODEL_PARAMS': '{"temperature":0.01, "return_full_text":false, "max_new_tokens": 150}',
        'LLM_QA_ENABLE': false,
        'LLM_QA_USE_KENDRA_RETRIEVAL_API': false,
        'LLM_QA_PROMPT_TEMPLATE':
            "Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. Write the answer in up to 5 complete sentences.<br><br>{context}<br><br>Question: {query}<br>Helpful Answer:",
        'LLM_QA_MODEL_PARAMS': '{"temperature":0.01, "return_full_text":false, "max_new_tokens": 150}',
        'LLM_QA_PREFIX_MESSAGE': 'LLM Answer:',
        'LLM_QA_SHOW_CONTEXT_TEXT': false,
        'LLM_QA_SHOW_SOURCE_LINKS': false,
        'LLM_CHAT_HISTORY_MAX_MESSAGES': 12,
        'LLM_QA_NO_HITS_REGEX':
            'Sorry,  //remove comment to enable custom no match (no_hits) when LLM does not know the answer.',
        'LLM_PROMPT_MAX_TOKEN_LIMIT': '800',
        'DEFAULT_USER_POOL_JWKS_URL':
            'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_MqFhpJCyo/.well-known/jwks.json'
    },
    '_type': 'LEX',
    '_preferredResponseType': 'PlainText',
    '_clientType': 'LEX.LexWebUI.Text',
    '_lexVersion': 'V2',
    '_userId': 'us-east-1:1038b5e8-8856-49ba-9652-b7b98092472a',
    'invocationSource': 'FulfillmentCodeHook',
    'intentname': 'QnaIntent',
    'slots': {
        'qnaslot': 'How can I publish Kindle books?'
    },
    'question': 'How can I publish Kindle books?',
    'session': {
        'idtokenjwt': '<token redacted>',
        'userDetectedLocale': 'en',
        'userDetectedLocaleConfidence': 0.9416552782058716,
        'qnabotcontext': {
            'userLocale': 'en'
        },
        'userPrefs': {}
    },
    'sentiment': 'NEUTRAL',
    'sentimentScore': {
        'Mixed': 0.001415007864125073,
        'Negative': 0.17787976562976837,
        'Neutral': 0.8174440860748291,
        'Positive': 0.003261085832491517
    },
    '_fulfillment': {},
    '_info': {
        'es': {
            'address': 'search-opensearchdomai-n0y9d4yizdp3-qcxy7mfthfydubt7g2i677gwxi.us-east-1.es.amazonaws.com',
            'index': 'qna-dev-dev-master-4',
            'type': 'qna',
            'service': {
                'qid': 'QNA-dev-dev-master-4-ESQidLambda-BG3NcGuFVGH0',
                'proxy': 'QNA-dev-dev-master-4-ESProxyLambda-ygX5h1oDOavJ'
            }
        }
    }
};

exports.res = {
    'type': 'PlainText',
    'message': '',
    'session': {
        'qnabot_qid': 'Help',
        'idtokenjwt': '<token redacted>',
        'qnabot_gotanswer': true,
        'qnabotcontext': {
            'previous': {
                'qid': 'Help',
                'q': 'help me'
            },
            'navigation': {
                'next': '',
                'previous': [],
                'hasParent': true
            }
        }
    },
    'card': {
        'send': false,
        'title': '',
        'text': '',
        'url': ''
    },
    'intentname': 'FallbackIntent',
    '_userInfo': {
        'UserId': 'QnaAdmin',
        'UserName': 'QnaAdmin',
        'Email': 'XXXXXXX',
        'isVerifiedIdentity': 'true'
    },
    'got_hits': 1
};

exports.hit = {
    "args": [
        "correct"
    ],
    "a": "test",
    "alt": {
        "markdown": "markdown test",
        "ssml": "ssml test"
    },
    "questions": [
        {
            "q": "original question"
        },
    ],
    "sa": [{
        "enableTranslate": false,
        "text": "TestName",
        "value": "TestValue"
    }],
    "r": {
        "buttons": [
          {
            "text": "ButtonText1",
            "value": "ButtonValue1"
          },
          {
            "text": "ButtonText2",
            "value": "ButtonValue2"
          }
        ],
        "text": "CardText",
        "imageUrl": "CardUrl",
        "url": "CardUrl",
        "subTitle": "CardSubtitle",
        "imageUrl": "CardUrl",
        "title": "CardTitle"
    },
    "l": "QNA:ExamplePYTHONLambdaFeedback",
    "type": "qna",
    "quniqueterms": "Thumbs up Good answer",
    "qid": "Feedback.002",
    "answersource": "OpenSearch (matched questions field)",
    "debug": [],
    "autotranslate": {
        "a": true,
        "rp": true,
        "alt": {
            "markdown": true,
            "ssml": true
        },
        "r": {
            "buttons": {
                "x": {
                    "text": true,
                    "value": true
                }
            },
            "subTitle": true,
            "title": true
          },
    },
    "kendraRedirectQueryText": "alexa AND \"custom skill\"",
    "kendraRedirectQueryArgs": ['test'],
    "rp": "Please either answer the question, ask another question or say Goodbye to end the conversation."
}