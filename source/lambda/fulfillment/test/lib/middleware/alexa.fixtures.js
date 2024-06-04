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