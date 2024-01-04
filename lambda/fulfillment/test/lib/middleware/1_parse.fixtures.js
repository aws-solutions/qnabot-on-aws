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

exports.createRequestObject = function (question, outputDialogMode, version, eventRequest) {
    const request =
    {
        "_event": {
            "inputTranscript": question,
            "outputDialogMode": outputDialogMode,
            "userId": "mocked_user_id"
        },
        "_setting": {
            "PROTECTED_UTTERANCES": "Thumbs up, Thumbs down"
        },
        "question": question,
    };
    if (version) {
        request._event.version= version;
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