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

exports.jwtDecodeResponse = {
    "payload": {
        "cognito:groups": ["Admins"],
        "email_verified": true,
        "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_OltJtd9x7",
        "cognito:username": "QnaAdmin",
        "aud": "74qphdr6l10sc15i13gmo2irhp",
        "event_id": "52e2e828-236b-42f6-b663-acce23ad5ebd",
        "token_use": "id",
        "auth_time": 1696544694,
        "exp": 1696548294,
        "iat": 1696544694,
        "jti": "2476a1cb-33c6-4752-92a3-48866fa2d83c",
        "email": "mock_email"
    }
}

exports.jwtDecodeResponseEnhanced = {
    "payload": {
        "cognito:groups": ["Admins"],
        "email_verified": true,
        "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_OltJtd9x7",
        "cognito:username": "QnaAdmin",
        "aud": "74qphdr6l10sc15i13gmo2irhp",
        "event_id": "52e2e828-236b-42f6-b663-acce23ad5ebd",
        "token_use": "id",
        "auth_time": 1696544694,
        "exp": 1696548294,
        "iat": 1696544694,
        "jti": "2476a1cb-33c6-4752-92a3-48866fa2d83c",
        "email": "mock_email",
        "preferred_username": "mock_preferred_username",
        "given_name" : "mock_given_name",
        "family_name" : "mock_family_name",
        "profile": "mock_profile"
    }
}

exports.ddbGetUserResponse = {
    "Item":
    {
        "UserId": "QnaAdmin",
        "InteractionCount": 1,
        "FirstSeen": "Thu Oct 05 2023 03:34:17",
        "chatMessageHistory": "[]",
        "LastSeen": "Thu Oct 05 2023 16:36:08",
        "TimeSinceLastInteraction": 1.672,
        "recentTopics": [{ "dateTime": "2023-10-05T16:34:57.656Z", "topic": "Astro" }, { "dateTime": "2023-10-05T04:15:50.296Z", "topic": "Soap" }],
        "UserName": "QnaAdmin",
        "Email": "mock_email",
        "isVerifiedIdentity": "true"
    }
}

exports.createRequestObject = function (question, removeIdTokensFromSession, requestType) {
    const request = {
        "_event": {

        },
        "_settings": {
            "MINIMUM_CONFIDENCE_SCORE": 0.6,
            "ENFORCE_VERIFIED_IDENTITY": false,
            "ENABLE_REDACTING_WITH_COMPREHEND": false,
            "LAMBDA_PREPROCESS_HOOK": "",
            "DEFAULT_USER_POOL_JWKS_URL": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1dsfsfjl/.well-known/jwks.json",
            "IDENTITY_PROVIDER_JWKS_URLS": [],
            "NO_VERIFIED_IDENTITY_QUESTION": "no_verified_identity",
            "PII_REJECTION_QUESTION": "pii_rejection_question"
        },
        "session": {
            "qnabotcontext": {
            },
            "idtokenjwt": "mock_id_token"
        },
        "question": question,
    };
    if (removeIdTokensFromSession) {
        request._settings.REMOVE_ID_TOKENS_FROM_SESSION = true;
    }
    if(requestType == 'LEX'){
        request._type = 'LEX';
        request._event.sessionAttributes = {"idtokenjwt" : "mock_id_token"};
    }
    if(requestType == 'ALEXA'){
        request._type = 'ALEXA';
        request._event.session = {"attributes" : {"idtokenjwt" : "mock_id_token"}};
    }
    return request;
}

exports.createResponseObject = function (question) {
    const response = {
        "_event": {
        },
        "_settings": {
            "MINIMUM_CONFIDENCE_SCORE": 0.6,
        },
        "session": {
            "qnabotcontext": {
            }
        },
        "question": question,
    };
    return response;
}