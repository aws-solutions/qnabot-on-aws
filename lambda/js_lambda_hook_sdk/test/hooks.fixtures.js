// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

exports.event = {
    "req": {
        "_event": {
            "sessionId": "us-east-1:24ac4405-504c-4787-9b11-aa5633788026",
            "inputTranscript": "Trigger Lambda",
            "interpretations": [
                {
                    "intent": {
                        "slots": {},
                        "confirmationState": "None",
                        "name": "FallbackIntent",
                        "state": "ReadyForFulfillment"
                    }
                },
                {
                    "intent": {
                        "slots": {
                            "qnaslot": {
                                "shape": "Scalar",
                                "value": {
                                    "originalValue": "Trigger Lambda",
                                    "resolvedValues": [],
                                    "interpretedValue": "Trigger Lambda"
                                }
                            }
                        },
                        "confirmationState": "None",
                        "name": "QnaIntent",
                        "state": "ReadyForFulfillment"
                    },
                    "nluConfidence": 0.7
                }
            ],
            "sessionState": {
                "sessionAttributes": {
                    "idtokenjwt": "<token redacted>"
                },
                "intent": {
                    "slots": {},
                    "confirmationState": "None",
                    "name": "FallbackIntent",
                    "state": "ReadyForFulfillment"
                },
                "originatingRequestId": "a9a1bbba-551e-4c9c-a344-2ab0540f0665"
            },
            "responseContentType": "text/plain; charset=utf-8",
            "invocationSource": "FulfillmentCodeHook",
            "messageVersion": "1.0",
            "transcriptions": [
                {
                    "resolvedContext": {
                        "intent": "FallbackIntent"
                    },
                    "transcription": "Trigger Lambda",
                    "resolvedSlots": {},
                    "transcriptionConfidence": 1
                }
            ],
            "inputMode": "Text",
            "bot": {
                "aliasId": "EGTLBGKGBP",
                "aliasName": "live",
                "name": "v526-golden_QnaBot",
                "version": "2",
                "localeId": "en_US",
                "id": "QFH46TWJQQ"
            },
            "errorFound": false
        },
        "_settings": {
            "ENABLE_DEBUG_RESPONSES": true,
            "ENABLE_DEBUG_LOGGING": false,
            "ES_USE_KEYWORD_FILTERS": true,
            "ES_EXPAND_CONTRACTIONS": "{\"you're\":\"you are\",\"I'm\":\"I am\",\"can't\":\"cannot\"}",
            "ES_KEYWORD_SYNTAX_TYPES": "NOUN,PROPN,VERB,INTJ",
            "ES_SYNTAX_CONFIDENCE_LIMIT": ".20",
            "ES_MINIMUM_SHOULD_MATCH": "2<75%",
            "ES_NO_HITS_QUESTION": "no_hits",
            "ES_USE_FUZZY_MATCH": false,
            "ES_PHRASE_BOOST": "4",
            "ES_SCORE_ANSWER_FIELD": false,
            "ENABLE_SENTIMENT_SUPPORT": true,
            "ENABLE_MULTI_LANGUAGE_SUPPORT": false,
            "ENABLE_CUSTOM_TERMINOLOGY": false,
            "MINIMUM_CONFIDENCE_SCORE": 0.6,
            "ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE": "HIGH",
            "ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE": "HIGH",
            "ALT_SEARCH_KENDRA_INDEXES": "",
            "ALT_SEARCH_KENDRA_S3_SIGNED_URLS": true,
            "ALT_SEARCH_KENDRA_S3_SIGNED_URL_EXPIRE_SECS": 300,
            "ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT": 2,
            "ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE": "Amazon Kendra suggested answer.",
            "ALT_SEARCH_KENDRA_FAQ_MESSAGE": "Answer from Amazon Kendra FAQ.",
            "ALT_SEARCH_KENDRA_ANSWER_MESSAGE": "While I did not find an exact answer, these search results from Amazon Kendra might be helpful.",
            "ALT_SEARCH_KENDRA_RESPONSE_TYPES": "ANSWER,DOCUMENT,QUESTION_ANSWER",
            "ALT_SEARCH_KENDRA_ABBREVIATE_MESSAGE_FOR_SSML": true,
            "KENDRA_FAQ_INDEX": "",
            "KENDRA_FAQ_CONFIG_MAX_RETRIES": 8,
            "KENDRA_FAQ_CONFIG_RETRY_DELAY": 600,
            "KENDRA_FAQ_ES_FALLBACK": true,
            "ENABLE_KENDRA_WEB_INDEXER": false,
            "KENDRA_INDEXER_URLS": "",
            "KENDRA_INDEXER_CRAWL_DEPTH": 3,
            "KENDRA_INDEXER_CRAWL_MODE": "SUBDOMAINS",
            "KENDRA_INDEXER_SCHEDULE": "rate(1 day)",
            "KENDRA_WEB_PAGE_INDEX": "",
            "KENDRA_INDEXED_DOCUMENTS_LANGUAGES": "en",
            "ERRORMESSAGE": "Unfortunately I encountered an error when searching for your answer. Please ask me again later.",
            "EMPTYMESSAGE": "You stumped me! Sadly I do not know how to answer your question.",
            "DEFAULT_ALEXA_LAUNCH_MESSAGE": "Hello, Please ask a question",
            "DEFAULT_ALEXA_REPROMPT": "Please either answer the question, ask another question or say Goodbye to end the conversation.",
            "DEFAULT_ALEXA_STOP_MESSAGE": "Goodbye",
            "SMS_HINT_REMINDER_ENABLE": true,
            "SMS_HINT_REMINDER": " (Feedback? Reply THUMBS UP or THUMBS DOWN. Ask HELP ME at any time)",
            "SMS_HINT_REMINDER_INTERVAL_HRS": "24",
            "IDENTITY_PROVIDER_JWKS_URLS": [],
            "ENFORCE_VERIFIED_IDENTITY": false,
            "NO_VERIFIED_IDENTITY_QUESTION": "no_verified_identity",
            "ELICIT_RESPONSE_MAX_RETRIES": 3,
            "ELICIT_RESPONSE_RETRY_MESSAGE": "Please try again.",
            "ELICIT_RESPONSE_BOT_FAILURE_MESSAGE": "Your response was not understood. Please start again.",
            "ELICIT_RESPONSE_DEFAULT_MSG": "Ok. ",
            "CONNECT_IGNORE_WORDS": "",
            "CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT": false,
            "CONNECT_NEXT_PROMPT_VARNAME": "connect_nextPrompt",
            "ENABLE_REDACTING": false,
            "REDACTING_REGEX": "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b",
            "ENABLE_REDACTING_WITH_COMPREHEND": false,
            "COMPREHEND_REDACTING_CONFIDENCE_SCORE": 0.99,
            "COMPREHEND_REDACTING_ENTITY_TYPES": "ADDRESS,EMAIL,SSN,PHONE,PASSWORD,BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER",
            "PII_REJECTION_ENABLED": false,
            "PII_REJECTION_QUESTION": "pii_rejection_question",
            "PII_REJECTION_REGEX": "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b",
            "PII_REJECTION_ENTITY_TYPES": "ADDRESS,EMAIL,SSN,PHONE,PASSWORD,BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER",
            "PII_REJECTION_CONFIDENCE_SCORE": 0.99,
            "DISABLE_CLOUDWATCH_LOGGING": false,
            "MINIMAL_ES_LOGGING": false,
            "S3_PUT_REQUEST_ENCRYPTION": "",
            "BOT_ROUTER_WELCOME_BACK_MSG": "Welcome back to QnABot.",
            "BOT_ROUTER_EXIT_MSGS": "exit,quit,goodbye,leave",
            "RUN_LAMBDAHOOK_FROM_QUERY_STEP": true,
            "LAMBDA_PREPROCESS_HOOK": "",
            "LAMBDA_POSTPROCESS_HOOK": "",
            "SEARCH_REPLACE_QUESTION_SUBSTRINGS": "",
            "DEFAULT_USER_POOL_JWKS_URL": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Zlne3mlEd/.well-known/jwks.json"
        },
        "_type": "LEX",
        "_lexVersion": "V2",
        "_userId": "us-east-1:24ac4405-504c-4787-9b11-aa5633788026",
        "invocationSource": "FulfillmentCodeHook",
        "intentname": "FallbackIntent",
        "slots": {},
        "question": "Trigger Lambda",
        "session": {
            "idtokenjwt": "<token redacted>",
            "userPrefs": {},
            "qnabotcontext": {}
        },
        "_preferredResponseType": "PlainText",
        "_clientType": "LEX.LexWebUI.Text",
        "sentiment": "NEUTRAL",
        "sentimentScore": {
            "Positive": 0.008091084659099579,
            "Negative": 0.19534291326999664,
            "Neutral": 0.7965446710586548,
            "Mixed": 0.000021379006284405477
        },
        "_fulfillment": {},
        "_userInfo": {
            "UserId": "Admin",
            "InteractionCount": 44,
            "FirstSeen": "Mon Jan 16 2023 20:30:35 GMT+0000 (Coordinated Universal Time)",
            "LastSeen": "Sun Jan 22 2023 19:35:30 GMT+0000 (Coordinated Universal Time)",
            "TimeSinceLastInteraction": 727.513,
            "recentTopics": [],
            "UserName": "Admin",
            "Email": "fake@example.com",
            "isVerifiedIdentity": "true"
        },
        "_info": {
            "es": {
                "address": "search-v526-go-elasti-1untrq0wvwpfj-u4ab5klv2lnz4bvsh5veec4m7m.us-east-1.es.amazonaws.com",
                "index": "v526-golden",
                "type": "qna",
                "service": {
                    "qid": "v526-golden-ESQidLambda-CQzDoRuaYFrb",
                    "proxy": "v526-golden-ESProxyLambda-synsri1S3dw4"
                }
            }
        }
    },
    "res": {
        "type": "PlainText",
        "message": "Hello from QnABot!",
        "session": {
            "idtokenjwt": "<token redacted>",
            "qnabotcontext": {
                "previous": {
                    "qid": "Lambda.Test",
                    "q": "Trigger Lambda"
                },
                "navigation": {
                    "next": "",
                    "previous": [],
                    "hasParent": true
                }
            },
            "appContext": {
                "altMessages": {
                    "ssml": "<speak>Hello! from Q-N-A Bot!</speak>",
                    "markdown": "Hello from __QnABot__!"
                }
            },
            "qnabot_qid": "Lambda.Test",
            "qnabot_gotanswer": true
        },
        "card": {
            "send": true,
            "title": "LambdaImage",
            "text": "",
            "url": "",
            "imageUrl": "https://d1.awsstatic.com/product-marketing/Lambda/Diagrams/product-page-diagram_Lambda-WebApplications%202.c7f8cf38e12cb1daae9965ca048e10d676094dc1.png",
            "buttons": [
                {
                    "text": "Help",
                    "value": "QID::Help"
                }
            ]
        },
        "intentname": "FallbackIntent",
        "_userInfo": {
            "UserId": "Admin",
            "InteractionCount": 45,
            "FirstSeen": "Mon Jan 16 2023 20:30:35 GMT+0000 (Coordinated Universal Time)",
            "LastSeen": "Sun Jan 22 2023 19:47:37 GMT+0000 (Coordinated Universal Time)",
            "TimeSinceLastInteraction": 727.513,
            "recentTopics": [],
            "UserName": "Admin",
            "Email": "fake@example.com",
            "isVerifiedIdentity": "true"
        },
        "got_hits": 1,
        "result": {
            "qid": "Lambda.Test",
            "quniqueterms": " Trigger Lambda  ",
            "questions": [
                {
                    "q": "Trigger Lambda"
                }
            ],
            "a": "Hello from QnABot!",
            "alt": {
                "ssml": "<speak>Hello! from Q-N-A Bot!</speak>",
                "markdown": "Hello from __QnABot__!"
            },
            "r": {
                "title": "LambdaImage",
                "imageUrl": "https://d1.awsstatic.com/product-marketing/Lambda/Diagrams/product-page-diagram_Lambda-WebApplications%202.c7f8cf38e12cb1daae9965ca048e10d676094dc1.png",
                "buttons": [
                    {
                        "text": "Help",
                        "value": "QID::Help"
                    }
                ]
            },
            "l": "qna-TestLambdaHook",
            "args": [
                "parameter1",
                "{ \"key\": \"value\" }"
            ],
            "type": "qna",
            "answersource": "ElasticSearch",
            "autotranslate": {
                "a": true,
                "alt": {
                    "markdown": true,
                    "ssml": true
                },
                "rp": true,
                "r": {
                    "title": true,
                    "buttons": {
                        "x": {
                            "text": true,
                            "value": true
                        }
                    }
                }
            },
            "rp": "Please either answer the question, ask another question or say Goodbye to end the conversation."
        },
        "plainMessage": "Hello from QnABot!",
        "answerSource": "ELASTICSEARCH",
        "reprompt": {
            "type": "PlainText",
            "text": "Please either answer the question, ask another question or say Goodbye to end the conversation."
        }
    }
}

exports.mockArgs = [
    //args attributes from event object above
    "parameter1",
    { "key": "value" }
]

exports.mockMessage = {
    plainText: this.event["res"]["result"]["a"],
    markDown: this.event["res"]["result"]["alt"]["markdown"],
    ssml: this.event["res"]["result"]["alt"]["ssml"]
}

exports.mockSessionAttributes = {
    //request attributes from event object above
    "idtokenjwt": "<token redacted>",
    "userPrefs": {},
    "qnabotcontext": {},

    //response attributes from event object above
    //response keys should override the request attributes
    "idtokenjwt": "<token redacted>",
    "qnabotcontext": {
        "previous": {
            "qid": "Lambda.Test",
            "q": "Trigger Lambda"
        },
        "navigation": {
            "next": "",
            "previous": [],
            "hasParent": true
        }
    },
    "appContext": {
        "altMessages": {
            "ssml": "<speak>Hello! from Q-N-A Bot!</speak>",
            "markdown": "Hello from __QnABot__!"
        }
    },
    "qnabot_qid": "Lambda.Test",
    "qnabot_gotanswer": true,

    //custom attributes for test
    "unit-test": "testValue"
}

exports.mockUserAttributes = {
    //request attributes from event object above
    "UserId": "Admin",
    "InteractionCount": 44,
    "FirstSeen": "Mon Jan 16 2023 20:30:35 GMT+0000 (Coordinated Universal Time)",
    "LastSeen": "Sun Jan 22 2023 19:35:30 GMT+0000 (Coordinated Universal Time)",
    "TimeSinceLastInteraction": 727.513,
    "recentTopics": [],
    "UserName": "Admin",
    "Email": "fake@example.com",
    "isVerifiedIdentity": "true",

    //response attributes from event object above
    //response keys should override the request attributes
    "UserId": "Admin",
    "InteractionCount": 45,
    "FirstSeen": "Mon Jan 16 2023 20:30:35 GMT+0000 (Coordinated Universal Time)",
    "LastSeen": "Sun Jan 22 2023 19:47:37 GMT+0000 (Coordinated Universal Time)",
    "TimeSinceLastInteraction": 727.513,
    "recentTopics": [],
    "UserName": "Admin",
    "Email": "fake@example.com",
    "isVerifiedIdentity": "true",

    //custom attributes for test
    "unit-test": "testValue"
}