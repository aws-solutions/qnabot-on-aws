/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.translateTextRequest = {
    SourceLanguageCode: 'en',
    TargetLanguageCode: 'fr',
    Text: 'Hello World!'
}

exports.requestObject = {
    "_event": {

    },
    "_settings": {
        "MINIMUM_CONFIDENCE_SCORE": 0.6,
        "PROTECTED_UTTERANCES": "Thumbs up, Thumbs down",
        "BACKUP_LANGUAGE": "English",
        "NATIVE_LANGUAGE": "French"
    },
    "session": {
        "qnabotcontext": {
        }
    },
    "question": "What is QnABot",
}

exports.requestObjectCustomTerminologyEnabled = {
    "_settings": {
        "ENABLE_CUSTOM_TERMINOLOGY": true
    }
}

exports.translateTextCommandResponse = {
    "SourceLanguageCode": "en",
    "TargetLanguageCode": "es",
    "TranslatedText": "Texto de prueba para traducir",
    "AppliedTerminologies": []
}

exports.translateTextCommandResponseQuestion = {
    "SourceLanguageCode": "en",
    "TargetLanguageCode": "es",
    "TranslatedText": "¿Qué es QnABot?",
    "AppliedTerminologies": []
}

exports.translateTextCommandResponseQuestionSpanish = {
    "SourceLanguageCode": "fr",
    "TargetLanguageCode": "es",
    "TranslatedText": "¿Como está el clima?",
    "AppliedTerminologies": []
}

exports.translateTextCommandResponseEnglish = {
    "SourceLanguageCode": "en",
    "TargetLanguageCode": "es",
    "TranslatedText": "What is QnABot",
    "AppliedTerminologies": []
}

exports.listTerminologiesCommandResponse = {
    "TerminologyPropertiesList": [
        {
            "Name": "terms",
            "Arn": "mock_arn",
            "SourceLanguageCode": "en",
            "TargetLanguageCodes": ["fr", "es"],
            "SizeBytes": 65,
            "TermCount": 2,
            "CreatedAt": "2023-10-05T04:11:53.125Z",
            "LastUpdatedAt": "2023-10-05T04:11:53.257Z",
            "Format": "CSV"
        }
    ]
}

exports.detectDominantLanguageCommandResponseEnglish = {
    Languages: [{
        "LanguageCode": "en",
        "Score": 1
    }]
}

exports.detectDominantLanguageCommandResponseSpanish = {
    Languages: [{
        "LanguageCode": "es",
        "Score": 1
    }]
}

exports.detectDominantLanguageCommandResponseFrench = {
    Languages: [{
        "LanguageCode": "fr",
        "Score": 1
    }]
}

exports.detectDominantLanguageCommandResponseMultiple = {
    Languages: [{
        "LanguageCode": "en",
        "Score": 0.8
    },
    {
        "LanguageCode": "es",
        "Score": 0.2
    }]
}

exports.detectDominantLanguageCommandResponseLowConfidence = {
    Languages: [{
        "LanguageCode": "es",
        "Score": 0.5
    }]
}

exports.createRequestObject = function (question, userPreferredLocale) {
    const request = {
        "_event": {
        },
        "_settings": {
            "MINIMUM_CONFIDENCE_SCORE": 0.6,
            "PROTECTED_UTTERANCES": "Thumbs up, Thumbs down",
            "BACKUP_LANGUAGE": "English",
            "NATIVE_LANGUAGE": "Spanish"
        },
        "session": {
            "qnabotcontext": {
            }
        },
        "question": question,
    };
    if (userPreferredLocale) {
        request.session.qnabotcontext.userPreferredLocale = userPreferredLocale;
    }

    return request;
}