// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

exports.listData = {
    //only mocking the partial response object as we want to test the transform
    listTerminologiesResponseMock: {
        "TerminologyPropertiesList": [
            {
                "Name": "testList",
                "SourceLanguageCode": "en",
                "TargetLanguageCodes": [
                    "de",
                    "fr",
                    "es"
                ],
                "TermCount": 3
            }
        ]
    },
    listApiOutput: [
        {
            "Name": "testList",
            "SourceLanguage": "en",
            "TargetLanguageCodes": [
                "de",
                "fr",
                "es"
            ],
            "TermCount": 3
        }
    ]
}

exports.importData = {
    importApiInput: `{
        "file": "77u/ZW4sZnIsZGUsZXMNCkFtYXpvbixBbWF6b24sQW1hem9uLEFtYXpvbg==",
        "name": "testImport"
    }`,
    importTerminologiesResponseMock: {
        "TerminologyProperties": {
            "Arn": "fake-arn",
            "CreatedAt": 1.670889033029E9,
            "Directionality": "UNI",
            "Format": "CSV",
            "LastUpdatedAt": 1.670889033241E9,
            "Name": "testImport",
            "SizeBytes": 43,
            "SourceLanguageCode": "en",
            "TargetLanguageCodes": [
                "de",
                "fr",
                "es"
            ],
            "TermCount": 3
        }
    }
}

exports.createEvent = (eventPartial) => {
    let eventDefault = {
        path: "/test/translate/list",
        stage: "test"
    }

    return { requestContext: {...eventDefault, ...eventPartial} }
}