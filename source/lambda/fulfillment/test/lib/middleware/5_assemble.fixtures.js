/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.createRequestObject = function (question, requestType, smsEnabled) {
    const request = {
        "_event": {
            "sessionAttributes": {
                "previous": '{"qid": "Test.001", "q": "Ask my name?"}'
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
            "SMS_HINT_REMINDER_ENABLE": true,
            "SMS_HINT_REMINDER_INTERVAL_HRS": 24,
            "SMS_HINT_REMINDER": "(Feedback? Reply THUMBS UP or THUMBS DOWN. Ask HELP ME at any time)",
            "CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT": false
        },
        "session": {
            "qnabotcontext": {
            },
            "idtokenjwt": "mock_id_token"
        },
        "question": question,
        "_userInfo": {
            "TimeSinceLastInteraction": 3600
        }
    };
    if (requestType == 'LEX') {
        request._type = 'LEX';
        request._event.sessionAttributes = { "idtokenjwt": "mock_id_token" };
    }
    if (requestType == 'ALEXA') {
        request._type = 'ALEXA';
        request._event.session = { "attributes": { "idtokenjwt": "mock_id_token" } };
    }
    if (smsEnabled) {
        request._event.requestAttributes = { "x-amz-lex:channel-type": "Twilio-SMS" };
    }
    return request;
}


exports.mockResponse = {

}

exports.createMockResponse = function (responseType) {
    const response = {
        "type": responseType,
        "message": "QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback",
        "session": {
            "connect_nextPrompt": "",
            "qnabot_qid": "Qna.001",
            "qnabot_gotanswer": true,
            "qnabotcontext": {
                "userLocale": "en",
            },
            "userDetectedLocaleConfidence": 0.9326399564743042,
            "userDetectedLocale": "en",
            "appContext": {

            }
        },
        "intentname": "FallbackIntent",
        "_userInfo": {
            "UserId": "QnaAdmin",
            "InteractionCount": 1644,
            "FirstSeen": "Wed Oct 11 2023 16:39:42 GMT+0000 (Coordinated Universal Time)",
            "chatMessageHistory": "[{\"Human\":\"Quiz start\"},{\"AI\":\"Let's start the quiz: The first question is: Which celestial object is a planet? A) Earth B) Moon C) Pluto D) Mars\"}]",
            "LastSeen": "Fri Oct 13 2023 02:34:32 GMT+0000 (Coordinated Universal Time)",
            "TimeSinceLastInteraction": 6.789,
            "recentTopics": [
                {
                    "dateTime": "2023-10-12T21:30:43.272Z",
                    "topic": "Astro"
                },
                {
                    "dateTime": "2023-10-12T21:30:43.670Z",
                    "topic": "Soap"
                }
            ],
            "UserName": "QnaAdmin",
            "Email": "mock_email",
            "isVerifiedIdentity": "true"
        },
        "session": {
            "qnabotcontext": {

            }
        },
        "result": {
            "qid": "Qna.001"
        }
    };
    return response;
};

exports.mockAssembleOutput = {
    "type": "",
    "message": "QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback",
    "session": {
        "connect_nextPrompt": "",
        "qnabot_qid": "Qna.001",
        "qnabot_gotanswer": true,
        "qnabotcontext": {
            "userLocale": "en",
        },
        "userDetectedLocaleConfidence": 0.9326399564743042,
        "userDetectedLocale": "en",
        "appContext": {

        }
    },
    "intentname": "FallbackIntent",
    "_userInfo": {
        "UserId": "QnaAdmin",
        "InteractionCount": 1644,
        "FirstSeen": "Wed Oct 11 2023 16:39:42 GMT+0000 (Coordinated Universal Time)",
        "chatMessageHistory": "[{\"Human\":\"Quiz start\"},{\"AI\":\"Let's start the quiz: The first question is: Which celestial object is a planet? A) Earth B) Moon C) Pluto D) Mars\"}]",
        "LastSeen": "Fri Oct 13 2023 02:34:32 GMT+0000 (Coordinated Universal Time)",
        "TimeSinceLastInteraction": 6.789,
        "recentTopics": [
            {
                "dateTime": "2023-10-12T21:30:43.272Z",
                "topic": "Astro"
            },
            {
                "dateTime": "2023-10-12T21:30:43.670Z",
                "topic": "Soap"
            }
        ],
        "UserName": "QnaAdmin",
        "Email": "mock_email",
        "isVerifiedIdentity": "true"
    },
    "session": {
        "qnabotcontext": {

        }
    },
    "result": {
        "qid": "Qna.001"
    }
};
