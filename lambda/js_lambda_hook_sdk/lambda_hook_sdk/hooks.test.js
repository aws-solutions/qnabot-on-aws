const hooks = require("./hooks")
const _ = require("lodash");


const srcEvent = {
    "req": {
        _fullfillment:{
            step: "preproccess"
        },
        "_event": {
            "sessionId": "test-sessionId",
            "inputTranscript": "What is the client answer",
            "interpretations": [
                {
                    "intent": {
                        "slots": {
                            "qnaslot": {
                                "shape": "Scalar",
                                "value": {
                                    "originalValue": "What is the client answer",
                                    "resolvedValues": [],
                                    "interpretedValue": "What is the client answer"
                                }
                            }
                        },
                        "confirmationState": "None",
                        "name": "QnaIntent",
                        "state": "ReadyForFulfillment"
                    },
                    "nluConfidence": 0.93
                },
                {
                    "intent": {
                        "slots": {},
                        "confirmationState": "None",
                        "name": "FallbackIntent",
                        "state": "ReadyForFulfillment"
                    }
                }
            ],
            "responseContentType": "text/plain; charset=utf-8",
            "invocationSource": "FulfillmentCodeHook",
            "messageVersion": "1.0",
            "sessionState": {
                "sessionAttributes": {
                    "qnabot_qid": "set.client2",
                    "qnabot_gotanswer": "true",
                    "qnabotcontext": "{\"previous\":{\"qid\":\"set.client2\",\"q\":\"set client2\"},\"navigation\":{\"next\":\"\",\"previous\":[],\"hasParent\":true}}",
                    "QNAClientFilter": "client2",
                
                },
                "activeContexts": [],
                "intent": {
                    "slots": {
                        "qnaslot": {
                            "shape": "Scalar",
                            "value": {
                                "originalValue": "What is the client answer",
                                "resolvedValues": [],
                                "interpretedValue": "What is the client answer"
                            }
                        }
                    },
                    "confirmationState": "None",
                    "name": "QnaIntent",
                    "state": "ReadyForFulfillment"
                },
                "originatingRequestId": "originalRequestID-AAAABBBBB"
            },
            "inputMode": "Text",
            "bot": {
                "aliasId": "6E0OEAQD5Y",
                "aliasName": "live",
                "name": "QNA-clientfilter-dev-master-1_QnaBot",
                "version": "1",
                "localeId": "en_US",
                "id": "9MGCBPJAZM"
            },
            "errorFound": false
        },
        "_settings": {
            "ENABLE_DEBUG_RESPONSES": false,
            "ES_USE_KEYWORD_FILTERS": true,
            "ES_EXPAND_CONTRACTIONS": "{\"you're\":\"you are\",\"I'm\":\"I am\",\"can't\":\"cannot\"}",
            "ES_KEYWORD_SYNTAX_TYPES": "NOUN,PROPN,VERB,INTJ",
            "ES_SYNTAX_CONFIDENCE_LIMIT": ".20",
            "ES_MINIMUM_SHOULD_MATCH": "2<75%",
            "ES_NO_HITS_QUESTION": "no_hits",
            "ES_USE_FUZZY_MATCH": false,
            "ES_ENABLE_CLIENT_FILTERS": true,
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
            "KENDRA_FAQ_INDEX": "",
            "KENDRA_FAQ_CONFIG_MAX_RETRIES": 8,
            "KENDRA_FAQ_CONFIG_RETRY_DELAY": 600,
            "KENDRA_FAQ_ES_FALLBACK": true,
            "ENABLE_KENDRA_WEB_INDEXER": false,
            "KENDRA_INDEXER_URLS": "",
            "KENDRA_INDEXER_SCHEDULE": "rate(1 day)",
            "KENDRA_WEB_PAGE_INDEX": "",
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
            "ELICIT_RESPONSE_RETRY_MESSAGE": "Please try again?",
            "ELICIT_RESPONSE_BOT_FAILURE_MESSAGE": "Your response was not understood. Please start again.",
            "ELICIT_RESPONSE_DEFAULT_MSG": "Ok. ",
            "CONNECT_IGNORE_WORDS": "",
            "CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT": false,
            "CONNECT_NEXT_PROMPT_VARNAME": "connect_nextPrompt",
            "ENABLE_REDACTING": false,
            "REDACTING_REGEX": "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b",
            "PII_REJECTION_ENABLED": false,
            "PII_REJECTION_QUESTION": "pii_rejection_question",
            "PII_REJECTION_WITH_COMPREHEND": true,
            "PII_REJECTION_REGEX": "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b",
            "PII_REJECTION_IGNORE_TYPES": "Name,Address",
            "DISABLE_CLOUDWATCH_LOGGING": false,
            "MINIMAL_ES_LOGGING": false,
            "S3_PUT_REQUEST_ENCRYPTION": "",
            "BOT_ROUTER_WELCOME_BACK_MSG": "Welcome back to QnABot.",
            "BOT_ROUTER_EXIT_MSGS": "exit,quit,goodbye,leave",
            "RUN_LAMBDAHOOK_FROM_QUERY_STEP": true,
            "DEFAULT_USER_POOL_JWKS_URL": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_v5ufwxtwc/.well-known/jwks.json"
        },
        "_type": "LEX",
        "_lexVersion": "V2",
        "_userId": "testUserId",
        "intentname": "QnaIntent",
        "question": "What is the client answer",
        "session": {
            "qnabot_qid": "set.client2",
            "qnabot_gotanswer": true,
            "qnabotcontext": {
                "previous": {
                    "qid": "set.client2",
                    "q": "set client2"
                },
                "navigation": {
                    "next": "",
                    "previous": [],
                    "hasParent": true
                }
            },
            "QNAClientFilter": "client2"
        },
        "_preferredResponseType": "PlainText",
        "_clientType": "LEX.Text",
        "sentiment": "NEUTRAL",
        "sentimentScore": {
            "Positive": 0.07607905566692352,
            "Negative": 0.3219950497150421,
            "Neutral": 0.5718414187431335,
            "Mixed": 0.030084457248449326
        },
        "_userInfo": {
            "UserId": "aaaaaaaaaa",
            "InteractionCount": 5,
            "FirstSeen": "Sat Jul 24 2021 14:08:51 GMT+0000 (Coordinated Universal Time)",
            "LastSeen": "Sat Jul 24 2021 14:09:51 GMT+0000 (Coordinated Universal Time)",
            "TimeSinceLastInteraction": 10.182,
            "recentTopics": [],
            "isVerifiedIdentity": "false"
        },
        "_info": {
            "es": {
                "address": "test-elasticSearchID",
                "index": "qna-clientfilter-dev-master-1",
                "type": "qna",
                "service": {
                    "qid": "test-qid",
                    "proxy": "test-proxy-lambda"
                }
            }
        }
    },
    "res": {
        "type": "PlainText",
        "message": "this is the client2 answer",
        "session": {
            "qnabot_qid": "client2.1",
            "qnabot_gotanswer": true,
            "qnabotcontext": {
                "previous": {
                    "qid": "client2.1",
                    "q": "What is the client answer"
                },
                "navigation": {
                    "next": "",
                    "previous": [],
                    "hasParent": true
                }
            },
            "QNAClientFilter": "client2",
            "appContext": {
                "altMessages": {}
            }
        },
        "card": {
            "send": true,
            "title": "Office.Dental",
            "text": "",
            "url": "",
            "buttons": [
                {
                    "text": "School of Dental Medicine",
                    "value": "QID::Office.Dental"
                },
                {
                    "text": "School of Engineering",
                    "value": "QID::Office.Engineering"
                }
            ]
        },
        "intentname": "QnaIntent",
        "_userInfo": {
            "UserId": "test-userid",
            "InteractionCount": 6,
            "FirstSeen": "Sat Jul 24 2021 14:08:51 GMT+0000 (Coordinated Universal Time)",
            "LastSeen": "Sat Jul 24 2021 14:10:01 GMT+0000 (Coordinated Universal Time)",
            "TimeSinceLastInteraction": 10.182,
            "recentTopics": [],
            "isVerifiedIdentity": "false"
        },
        "got_hits": 1,
        "result": {
            "qid": "client2.1",
            "a": "this is the client2 answer",
            "clientFilterValues": "client2",
            "type": "qna",
            "questions": [
                {
                    "q": "what is the client answer"
                }
            ],
            "quniqueterms": "what is the client answer",
            "answersource": "ElasticSearch",
            "autotranslate": {
                "a": true,
                "rp": true
            },
            "rp": "Please either answer the question, ask another question or say Goodbye to end the conversation.",
            "l": "",
            "args": ["{ \"test1\":\"A\",\"test2\":\"B\",\"test3\":\"C\"}","string test"]
        },
        "plainMessage": "this is the client2 answer",
        "answerSource": "ELASTICSEARCH",
        "reprompt": {
            "type": "PlainText",
            "text": "Please either answer the question, ask another question or say Goodbye to end the conversation."
        }
    }
}

const srcEvent2 = {
    "req": {
        "_event": {
            "sessionId": "test-session2",
            "inputTranscript": "QID::Office.Dental",
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
                            "qnaslot": null
                        },
                        "confirmationState": "None",
                        "name": "QnaIntent",
                        "state": "ReadyForFulfillment"
                    },
                    "nluConfidence": 0.47
                }
            ],
            "responseContentType": "text/plain; charset=utf-8",
            "invocationSource": "FulfillmentCodeHook",
            "messageVersion": "1.0",
            "sessionState": {
                "sessionAttributes": {
                    "qnabot_qid": "Office.Dental",
                    "qnabot_gotanswer": "true",
                    "qnabotcontext": "{\"previous\":{\"qid\":\"Office.Dental\",\"q\":\"QID::Office.Dental\"},\"navigation\":{\"next\":\"\",\"previous\":[],\"hasParent\":true}}",
                    "topic": "Dental"
                },
                "activeContexts": [],
                "intent": {
                    "slots": {},
                    "confirmationState": "None",
                    "name": "FallbackIntent",
                    "state": "ReadyForFulfillment"
                },
                "originatingRequestId": "test-request-id"
            },
            "inputMode": "Text",
            "bot": {
                "aliasId": "6E0OEAQD5Y",
                "aliasName": "live",
                "name": "qna-client-5",
                "version": "1",
                "localeId": "en_US",
                "id": "9MGCBPJAZM"
            },
            "errorFound": false
        },
        "_settings": {
            "ENABLE_DEBUG_RESPONSES": false,
            "ES_USE_KEYWORD_FILTERS": true,
            "ES_EXPAND_CONTRACTIONS": "{\"you're\":\"you are\",\"I'm\":\"I am\",\"can't\":\"cannot\"}",
            "ES_KEYWORD_SYNTAX_TYPES": "NOUN,PROPN,VERB,INTJ",
            "ES_SYNTAX_CONFIDENCE_LIMIT": ".20",
            "ES_MINIMUM_SHOULD_MATCH": "2<75%",
            "ES_NO_HITS_QUESTION": "no_hits",
            "ES_USE_FUZZY_MATCH": false,
            "ES_ENABLE_CLIENT_FILTERS": true,
            "ES_PHRASE_BOOST": "4",
            "ES_SCORE_ANSWER_FIELD": false,
            "ENABLE_SENTIMENT_SUPPORT": true,
            "ENABLE_MULTI_LANGUAGE_SUPPORT": false,
            "ENABLE_CUSTOM_TERMINOLOGY": false,
            "MINIMUM_CONFIDENCE_SCORE": 0.6,
            "ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE": "HIGH",
            "ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE": "HIGH",
            "ALT_SEARCH_KENDRA_INDEXES": "56ed5cac-9e5c-44b9-a966-3d05cc4e3a64",
            "ALT_SEARCH_KENDRA_S3_SIGNED_URLS": true,
            "ALT_SEARCH_KENDRA_S3_SIGNED_URL_EXPIRE_SECS": 300,
            "ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT": 2,
            "ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE": "Amazon Kendra suggested answer.",
            "ALT_SEARCH_KENDRA_FAQ_MESSAGE": "Answer from Amazon Kendra FAQ.",
            "ALT_SEARCH_KENDRA_ANSWER_MESSAGE": "While I did not find an exact answer, these search results from Amazon Kendra might be helpful.",
            "KENDRA_FAQ_INDEX": "56ed5cac-9e5c-44b9-a966-3d05cc4e3a64",
            "KENDRA_FAQ_CONFIG_MAX_RETRIES": 8,
            "KENDRA_FAQ_CONFIG_RETRY_DELAY": 600,
            "KENDRA_FAQ_ES_FALLBACK": true,
            "ENABLE_KENDRA_WEB_INDEXER": true,
            "KENDRA_INDEXER_URLS": "https://aws.amazon.com/kendra/",
            "KENDRA_INDEXER_SCHEDULE": "rate(1 day)",
            "KENDRA_WEB_PAGE_INDEX": "56ed5cac-9e5c-44b9-a966-3d05cc4e3a64",
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
            "ELICIT_RESPONSE_RETRY_MESSAGE": "Please try again?",
            "ELICIT_RESPONSE_BOT_FAILURE_MESSAGE": "Your response was not understood. Please start again.",
            "ELICIT_RESPONSE_DEFAULT_MSG": "Ok. ",
            "CONNECT_IGNORE_WORDS": "",
            "CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT": false,
            "CONNECT_NEXT_PROMPT_VARNAME": "connect_nextPrompt",
            "ENABLE_REDACTING": false,
            "REDACTING_REGEX": "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b",
            "PII_REJECTION_ENABLED": false,
            "PII_REJECTION_QUESTION": "pii_rejection_question",
            "PII_REJECTION_WITH_COMPREHEND": true,
            "PII_REJECTION_REGEX": "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b",
            "PII_REJECTION_IGNORE_TYPES": "Name,Address",
            "DISABLE_CLOUDWATCH_LOGGING": false,
            "MINIMAL_ES_LOGGING": false,
            "S3_PUT_REQUEST_ENCRYPTION": "",
            "BOT_ROUTER_WELCOME_BACK_MSG": "Welcome back to QnABot.",
            "BOT_ROUTER_EXIT_MSGS": "exit,quit,goodbye,leave",
            "RUN_LAMBDAHOOK_FROM_QUERY_STEP": true,
            "DEFAULT_USER_POOL_JWKS_URL": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_v5ufwxtwc/.well-known/jwks.json"
        },
        "_type": "LEX",
        "_lexVersion": "V2",
        "_userId": "12345678",
        "intentname": "FallbackIntent",
        "question": "QID::Office.Dental",
        "session": {
            "qnabot_qid": "Office.Dental",
            "qnabot_gotanswer": true,
            "qnabotcontext": {
                "previous": {
                    "qid": "Office.Dental",
                    "q": "QID::Office.Dental"
                },
                "navigation": {
                    "next": "",
                    "previous": [],
                    "hasParent": true
                }
            },
            "topic": "Dental"
        },
        "_preferredResponseType": "PlainText",
        "_clientType": "LEX.Text",
        "sentiment": "NEUTRAL",
        "sentimentScore": {
            "Positive": 0.0006423206650651991,
            "Negative": 0.0036459837574511766,
            "Neutral": 0.9957062602043152,
            "Mixed": 0.000005430766577774193
        },
        "_userInfo": {
            "UserId": "1234565",
            "InteractionCount": 3,
            "FirstSeen": "Tue Jul 27 2021 00:17:55 GMT+0000 (Coordinated Universal Time)",
            "LastSeen": "Tue Jul 27 2021 00:41:15 GMT+0000 (Coordinated Universal Time)",
            "TimeSinceLastInteraction": 59.677,
            "recentTopics": [
                {
                    "dateTime": "2021-07-27T00:41:15.492Z",
                    "topic": "Dental"
                }
            ],
            "isVerifiedIdentity": "false"
        },
        "_info": {
            "es": {
                "address": "12345678",
                "index": "qna-clientfilter-dev-master-1",
                "type": "qna",
                "service": {
                    "qid": "1234567",
                    "proxy": "12345678"
                }
            }
        }
    },
    "res": {
        "type": "PlainText",
        "message": "ABC Street",
        "session": {
            "qnabot_qid": "Office.Dental",
            "qnabot_gotanswer": "true",
            "qnabotcontext": "{\"previous\":{\"qid\":\"Office.Dental\",\"q\":\"QID::Office.Dental\"},\"navigation\":{\"next\":\"\",\"previous\":[],\"hasParent\":true}}",
            "topic": "Dental",
            "appContext": "{\"altMessages\":{\"ssml\":\"<loud>ABC Street</loud>\",\"markdown\":\"*ABC Street*\"}}"
        },
        "card": {
            "send": false,
            "title": "",
            "text": "",
            "url": "",
            "buttons": []
        },
        "intentname": "FallbackIntent",
        "_userInfo": {
            "UserId": "1234567",
            "InteractionCount": 4,
            "FirstSeen": "Tue Jul 27 2021 00:17:55 GMT+0000 (Coordinated Universal Time)",
            "LastSeen": "Tue Jul 27 2021 00:42:14 GMT+0000 (Coordinated Universal Time)",
            "TimeSinceLastInteraction": 59.677,
            "recentTopics": [
                {
                    "topic": "Dental",
                    "dateTime": "2021-07-27T00:42:14.724Z"
                }
            ],
            "isVerifiedIdentity": "false"
        },
        "got_hits": 1,
        "result": {
            "qid": "Office.Dental",
            "quniqueterms": " Where is the School of Dental Medicine office located?  ",
            "questions": [
                {
                    "q": "Where is the School of Dental Medicine office located?"
                }
            ],
            "a": "ABC Street",
            "alt": {
                "ssml": "<loud>ABC Street</loud>",
                "markdown": "*ABC Street*"
            },
            "t": "Dental",
            "type": "qna",
            "answersource": "ElasticSearch",
            "autotranslate": {
                "a": true,
                "alt": {
                    "markdown": true,
                    "ssml": true
                },
                "rp": true
            },
            "rp": "Please either answer the question, ask another question or say Goodbye to end the conversation.",
            "l": "",
            "args": []
        },
        "plainMessage": "ABC Street",
        "answerSource": "ELASTICSEARCH",
        "reprompt": {
            "type": "PlainText",
            "text": "Please either answer the question, ask another question or say Goodbye to end the conversation."
        },
        "out": {
            "sessionState": {
                "sessionAttributes": {
                    "qnabot_qid": "Office.Dental",
                    "qnabot_gotanswer": "true",
                    "qnabotcontext": "{\"previous\":{\"qid\":\"Office.Dental\",\"q\":\"QID::Office.Dental\"},\"navigation\":{\"next\":\"\",\"previous\":[],\"hasParent\":true}}",
                    "topic": "Dental",
                    "appContext": "{\"altMessages\":{\"ssml\":\"<loud>ABC Street</loud>\",\"markdown\":\"*ABC Street*\"}}"
                },
                "dialogAction": {
                    "type": "Close"
                },
                "intent": {
                    "name": "FallbackIntent",
                    "state": "Fulfilled"
                }
            },
            "messages": [
                {
                    "contentType": "PlainText",
                    "content": "ABC Street"
                }
            ]
        }
    }
}


describe("Lambda hooks tests",() => {
    test("get_step()",() => {
        let result = hooks.get_step(srcEvent)
        expect(result).toBe(hooks.PREPROCESS)
    })
    
    test("get_args",() => {
        let result = hooks.get_args(srcEvent)
        console.log(result)
        expect(result).toStrictEqual([
            {
                "test1":"A",
                "test2":"B",
                "test3":"C"
            },"string test"]
        )
    })

    test("get_lex_event", () => {
        let result = hooks.get_lex_event(srcEvent)
        expect(result).toBe(_.get(srcEvent,"req._event"))
    })

    test("get_bot",() => {
        let result = hooks.get_bot(srcEvent)
        expect(result).toBe(_.get(srcEvent,"req._event.bot"))
    })

    test("list_settings",() => {
        let result = hooks.list_settings(srcEvent)
        expect(result).toBe(_.get(srcEvent, "req._settings", {}))
    })

    test("get_settings",() => {
        let result = hooks.get_setting(srcEvent,"ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE")
        expect(result).toBe("HIGH")
    })

    test("list_session_attributes",() => {
        let result = hooks.list_session_attributes(srcEvent)
        expect(result).toBe(_.get(srcEvent, "req.session"))
    })

    test("list_user_attributes",() => {
        let result = hooks.list_user_attributes(srcEvent)
        expect(result).toBe(_.get(srcEvent,"req._userInfo",{}))
    })

    test("get_user_attribute",() => {
        let result = hooks.get_user_attribute(srcEvent,"InteractionCount")
        expect(result).toBe(6)
    })

    test("list_response_card_buttons",() => {
        let result = hooks.list_response_card_buttons(srcEvent)
        expect(result).toBe(_.get(srcEvent, "res.card.buttons"))
    })
    //todo create a separate event object to test this
    test("get_response_card_imageurl",() => {
        let result = hooks.get_response_card_imageurl(srcEvent)
        expect(result).toBe(_.get(srcEvent, "res.card.ImageUrl"))
    })

    test("get_message",() => {
        let result = hooks.get_message(srcEvent2)
        expect(result).toStrictEqual({
            plainText: "ABC Street" ,
            markDown: "*ABC Street*",
            ssml: "<loud>ABC Street</loud>"
        })
    })

    test("get_es_result",() => {
        let result = hooks.get_es_result(srcEvent)
        expect(result).toBe(_.get(srcEvent, "res.result"))
    })

    test("get_answer_source",() => {
        let result = hooks.get_answer_source(srcEvent)
        expect(result).toBe(_.get(srcEvent, "res.result.answerSource"))
    })

    test("get_question",() => {
        let result = hooks.get_question(srcEvent)
        expect(result).toBe(_.get(srcEvent, "req.question"))
    })

    test("add_session_attribute",() => {
        let event = _.cloneDeep(srcEvent)
        let expected = _.cloneDeep(srcEvent)

        let actual = hooks.add_session_attribute(event,"unit-test","this value")
        expected = _.get(expected,"res.session")
        expected["unit-test"] = "this value"
        
        expect(expected).toStrictEqual(actual)

    })

    test("add_user_attribute",() => {
        let event = _.cloneDeep(srcEvent)
        let expected = _.cloneDeep(srcEvent)

        let actual = hooks.add_user_attribute(event,"unit-test","this value")
        expected = _.get(expected,"res._userInfo")
        expected["unit-test"] = "this value"
        
        expect(expected).toStrictEqual(actual)

    })

    test("add_response_card_button should add value without a QID and append button",() => {
        let event = _.cloneDeep(srcEvent)
        let expected = _.cloneDeep(srcEvent)

        let actual = hooks.add_response_card_button(event,"unit-test","this value")
        expected = _.get(expected,"res.card.buttons",[])
        expected.push({
            text: "unit-test",
            value: "this value"
        })
        
        expect(expected).toStrictEqual(actual)

    })

    test("add_response_card_button should add value without a QID prepend button",() => {
        let event = _.cloneDeep(srcEvent)
        let expected = _.cloneDeep(srcEvent)

        let actual = hooks.add_response_card_button(event,"unit-test","this value",false,true)
        expected = _.get(expected,"res.card.buttons",[])
        expected.unshift({
            text: "unit-test",
            value: "this value"
        })
        
        expect(expected).toStrictEqual(actual)

    })

    test("add_response_card_button should add value with a QID prepend button",() => {
        let event = _.cloneDeep(srcEvent)
        let expected = _.cloneDeep(srcEvent)

        let actual = hooks.add_response_card_button(event,"unit-test","A.Question",true,true)
        expected = _.get(expected,"res.card.buttons",[])
        expected.unshift({
            text: "unit-test",
            value: "QID::A.Question"
        })
        
        expect(expected).toStrictEqual(actual)

    })

    test("set_response_card_title should overwrite if present",() => {
        let event = _.cloneDeep(srcEvent)
        _.set(event, "res.card.title", "original title")
        let expected = _.cloneDeep(srcEvent)

        let actual = hooks.set_response_card_title(event,"This is a test title.")
        expected = _.get(event, "res.card.title")

        
        expect(expected).toStrictEqual(actual)
        expect(expected).toBe("This is a test title.")

    })


    test("set_response_card_title should overwrite if present",() => {
        let event = _.cloneDeep(srcEvent)
        let expected = _.cloneDeep(srcEvent)
        _.set(expected, "res.card.title", "original title")


        let actual = hooks.set_response_card_title(expected,"This is a test title.",false)
        expected = _.get(expected, "res.card.title")

        
        expect(expected).toStrictEqual(actual)
        expect(expected).toBe("original title")

    })

})
