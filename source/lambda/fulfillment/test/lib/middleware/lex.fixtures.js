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

exports.createRequestObject = function (question, clientType, lexVersion, currentIntent) {
    const request = {
        "_type": 'LEX',
        "_clientType": clientType,
        "_lexVersion": lexVersion,
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
            }
        },
        "_settings": {
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
            "qnabotcontext": {
            },
            "idtokenjwt": "mock_id_token"
        },
        "_userInfo": {
            "TimeSinceLastInteraction": 3600
        },
        "question": question
    };


    if (lexVersion === "V1") {
        request._event.sessionAttributes = { "idtokenjwt": "<token redacted>" }
    }
    if (lexVersion === "V2") {
        request._event.invocationSource = "FulfillmentCodeHook";
        request._event.sessionState.sessionAttributes = { "idtokenjwt": "<token redacted>" };
        request._event.inputMode = "Text";
        request._event.sessionId = "mockSessionId";
    }
    if (currentIntent) {
        request._event.currentIntent = { "name": "testIntent" };
    }
    return request;
}

exports.createResponseObject = function (addButtons) {
    const response = {
        "type": "PlainText",
        "message": "The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.",
        "session": {
            "idtokenjwt": "<token redacted>",
            "qnabotcontext": "{\"previous\":{\"qid\":\"QnABot.001\",\"q\":\"What is Q and A Bot\"},\"navigation\":{\"next\":\"\",\"previous\":[],\"hasParent\":false}}",
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
        "plainMessage": "The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.",
        "answerSource": "OpenSearch (matched questions field)",
        "reprompt": {
            "type": "PlainText",
            "text": "Please either answer the question, ask another question or say Goodbye to end the conversation."
        }
    };

    if (addButtons) {
        response.card.buttons = [{
            "text": "mockText",
            "value": "mockValue"
        }];
        response.card.title = "mock_title";
        response.card.send = true;
    }
    return response;
}