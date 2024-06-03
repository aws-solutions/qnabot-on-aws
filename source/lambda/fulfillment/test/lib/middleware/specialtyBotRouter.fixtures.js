/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

exports.createRequestObject = function (question, preferredResponseType, botName) {
    const request = {
        "_type": 'LEX',
        "_event": {
            "inputTranscript": question,
            "userId": "mock_user_id",
            "sessionState": {
                "intent": {
                    "name": "mockIntent"
                },
            },
            "bot": {
                "localeId": "en_US"
            },
            "requestAttributes": {

            }
        },
        "_settings": {
            "BACKUP_LANGUAGE": "English",
            "NATIVE_LANGUAGE": "English",
            "MINIMUM_CONFIDENCE_SCORE": 0.6,
            "ENFORCE_VERIFIED_IDENTITY": false,
            "ENABLE_REDACTING_WITH_COMPREHEND": false,
            "LAMBDA_PREPROCESS_HOOK": "",
            "IDENTITY_PROVIDER_JWKS_URLS": [],
            "NO_VERIFIED_IDENTITY_QUESTION": "no_verified_identity",
            "PII_REJECTION_QUESTION": "pii_rejection_question",
            "ENABLE_MULTI_LANGUAGE_SUPPORT": true,
            "CONNECT_NEXT_PROMPT_VARNAME": "connect_nextPrompt",
            "CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT": false,
            "DEFAULT_ALEXA_LAUNCH_MESSAGE": "Hello, Please ask a question",
            "DEFAULT_ALEXA_STOP_MESSAGE": "Goodbye",
            "CONNECT_IGNORE_WORDS": ""
        },
        "session": {
            "myAttribute": "test",
            "qnabotcontext": {
                "specialtyBotMergeAttributes": "myAttribute,",
                "specialtyBotName": botName? botName: "test_bot"
            },
            "idtokenjwt": "mock_id_token"
        },
        "_userInfo": {
            "UserId": "testUser",
            "TimeSinceLastInteraction": 3600
        },
        "question": question,
        "sentiment": "NEUTRAL",
        "_preferredResponseType": preferredResponseType,
    };

    return request;
}

exports.createRequestObjectWithSpecialUserId = function (question, preferredResponseType, botName) {
    const request = {
        "_type": 'LEX',
        "_event": {
            "inputTranscript": question,
            "userId": "mock_user_id",
            "sessionState": {
                "intent": {
                    "name": "mockIntent"
                },
            },
            "bot": {
                "localeId": "en_US"
            },
            "requestAttributes": {

            }
        },
        "_settings": {
            "BACKUP_LANGUAGE": "English",
            "NATIVE_LANGUAGE": "English",
            "MINIMUM_CONFIDENCE_SCORE": 0.6,
            "ENFORCE_VERIFIED_IDENTITY": false,
            "ENABLE_REDACTING_WITH_COMPREHEND": false,
            "LAMBDA_PREPROCESS_HOOK": "",
            "IDENTITY_PROVIDER_JWKS_URLS": [],
            "NO_VERIFIED_IDENTITY_QUESTION": "no_verified_identity",
            "PII_REJECTION_QUESTION": "pii_rejection_question",
            "ENABLE_MULTI_LANGUAGE_SUPPORT": true,
            "CONNECT_NEXT_PROMPT_VARNAME": "connect_nextPrompt",
            "CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT": false,
            "DEFAULT_ALEXA_LAUNCH_MESSAGE": "Hello, Please ask a question",
            "DEFAULT_ALEXA_STOP_MESSAGE": "Goodbye",
            "CONNECT_IGNORE_WORDS": ""
        },
        "session": {
            "myAttribute": "test",
            "qnabotcontext": {
                "specialtyBotMergeAttributes": "myAttribute,",
                "specialtyBotName": botName? botName: "test_bot"
            },
            "idtokenjwt": "mock_id_token"
        },
        "_userInfo": {
            "UserId": "test@User!",
            "TimeSinceLastInteraction": 3600
        },
        "question": question,
        "sentiment": "NEUTRAL",
        "_preferredResponseType": preferredResponseType,
    };

    return request;
}

exports.createResponseObject = function (message) {
    const response = {
        "type": "PlainText",
        "message": message,
        "session": {
            "idtokenjwt": "<token redacted>",
            "qnabotcontext": {
                "elicitResponse":{ "namespace": "mockNamespace" },
                "specialtyBot": "mockBot",
            },
            "topic": "QnABot",
            "appContext": "",
            "qnabot_qid": "QnABot.001",
            "qnabot_gotanswer": "true"
        },
        "card": {
            "send": false,
            "title": "",
            "text": "",
            "url": ""
        },
        "intentname": "FallbackIntent",
        "_userInfo": {
            "UserId": "Admin",
            "InteractionCount": 2,
            "UserName": "Admin",
            "isVerifiedIdentity": "true",
            "TimeSinceLastInteraction": 1697549029.593,
            "FirstSeen": "Wed Oct 18 2023 01:23:49 GMT+0000 (Coordinated Universal Time)",
            "LastSeen": "Wed Oct 18 2023 01:23:49 GMT+0000 (Coordinated Universal Time)",
            "recentTopics": [
            ],
            "chatMessageHistory": "[{\"Human\":\"What is Q and A Bot\"},{\"AI\":\"The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.\"}]"
        },
        "got_hits": 1,
        "result": {
            "args": [],
            "next": "",
            "a": "The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.",
            "t": "QnABot",
            "alt": {
                "markdown": "# QnaBot\nThe Q and A Bot uses [Amazon Lex](https://aws.amazon.com/lex) and [Alexa](https://developer.amazon.com/alexa) to provide a natural language interface for your FAQ knowledge base. Now your users can just ask a *question* and get a quick and relevant *answer*.",
                "ssml": "<speak>AWS <sub alias=\"Q and A\">QnA</sub> Bot is <amazon:effect name=\"drc\">great</amazon:effect>. <sub alias=\"Q and A\">QnA</sub> Bot supports <sub alias=\"Speech Synthesis Markup Language\">SSML</sub> using Polly's neural voice. <prosody rate=\"150%\">I can speak very fast</prosody>, <prosody rate=\"75%\">or very slowly</prosody>. <prosody volume=\"-16dB\">I can speak quietly</prosody>, <amazon:effect name=\"drc\">or speak loud and clear</amazon:effect>. I can say <phoneme alphabet=\"ipa\" ph=\"təˈmɑːtəʊ\">tomato</phoneme> and tomato. Visit docs.aws.amazon.com/polly/latest/dg/supportedtags for more information.</speak>"
            },
            "questions": [
                {
                    "q": "What is Q and A Bot"
                }
            ],
            "l": "",
            "type": "qna",
            "quniqueterms": "What is Q and A Bot",
            "qid": "QnABot.001",
            "answersource": "OpenSearch (matched questions field)",
            "debug": [],
            "rp": "Please either answer the question, ask another question or say Goodbye to end the conversation."
        },
        "plainMessage": message ? message : "The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.",
        "answerSource": "OpenSearch (matched questions field)",
        "reprompt": {
            "type": "PlainText",
            "text": "Please either answer the question, ask another question or say Goodbye to end the conversation."
        }
    };

    return response;
};

exports.getLexV1Response = function (dialogState, message) {
    const response = {
        "botVersion": "live",
        "dialogState": dialogState,
        "intentName": "mockIntent",
        "message": message ? message : "Mock Response",
        "sentimentResponse": {
            "sentimentLabel": "mockLabel",
        },
        "sessionAttributes": [],
        "slots": {
            "testSlot": {"shape":"Scalar", "value": {"originalValue": "Test Value"}}
        }
    }
    return response;
};

exports.getLexV2Response = function (dialogState, message, intentName, slots) {
    const response =  {
        "sessionState": {
            "dialogAction": {
                "type": "Close"
            },
            "intent": {
                "confirmationState": "None",
                "name": intentName,
                "state": dialogState
            },
            "originatingRequestId": "84d3c829-a952-459d-bf5a-5a9acbc8d336",
            "sessionAttributes": {
                "myAttribute": "test"
            }
        }
    };

    if(message) {
        response.messages = [
            {
                "content": message,
                "contentType": "PlainText"
            }
        ]
    }
    if(slots){
        response.sessionState.intent.slots= slots;
    }

    return response;
};

exports.lambdaResponse = {
    "Payload": '{"message":"mockLambdaResponse", "sessionAttributes":[]}'
};