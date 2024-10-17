/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.createRequestObject = function (question, requestType, intentName) {
    const request = {
        "_type": 'ALEXA',

        "_event": {
            "session": {
                "attributes": { "idtokenjwt": "mock_id_token" },
                "user": { "userId": "mockUserId" }
            },
            "request": {
                "locale": "en-US",
                "type": requestType
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
            "CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT": false,
            "DEFAULT_ALEXA_LAUNCH_MESSAGE": "Hello, Please ask a question",
            "DEFAULT_ALEXA_STOP_MESSAGE": "Goodbye"
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

    if (requestType === "IntentRequest") {
        request._event.request.intent = { "name": intentName }
    }

    return request;
}


exports.createResponseObject = function (message, responseType, subtitle, imageUrl) {
    const response = {
        "message": message,
        "plainMessage": message,
        "card": {
            "subTitle": subtitle,
            "imageUrl": imageUrl
        },
        "type": responseType
    };

    return response;

}