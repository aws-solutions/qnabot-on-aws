/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.createRequestObject = function (question, outputDialogMode, version, eventRequest) {
    const request =
    {
        "_event": {
            "inputTranscript": question,
            "outputDialogMode": outputDialogMode,
            "userId": "mocked_user_id",
            "sessionState": {
                "intent": {
                    "name": "mock-name"
                }
            },
            "request": {
                "locale": "mock-locale"
            }
        },
        "_setting": {
            "PROTECTED_UTTERANCES": "Thumbs up, Thumbs down"
        },
        "question": question,
    };
    if (version) {
        request._event.version = version;
    }
    if(eventRequest) {
        request._event.request = eventRequest;
    }
    return request;
}

exports.defaultSettings = {
    "ENABLE_SENTIMENT_SUPPORT": false,
    "ENABLE_MULTI_LANGUAGE_SUPPORT": false,
    "SEARCH_REPLACE_QUESTION_SUBSTRINGS": "",
    "PROTECTED_UTTERANCES": "Thumbs up, Thumbs down",
}

exports.defaultSettingsMultiLang = {
    "ENABLE_SENTIMENT_SUPPORT": false,
    "ENABLE_MULTI_LANGUAGE_SUPPORT": true,
    "SEARCH_REPLACE_QUESTION_SUBSTRINGS": "test",
    "PROTECTED_UTTERANCES": "Thumbs up, Thumbs down",
};

exports.defaultSettingsSentiment = {
    "ENABLE_SENTIMENT_SUPPORT": true,
    "ENABLE_MULTI_LANGUAGE_SUPPORT": true,
    "SEARCH_REPLACE_QUESTION_SUBSTRINGS": "",
    "PROTECTED_UTTERANCES": "Thumbs up, Thumbs down",
}