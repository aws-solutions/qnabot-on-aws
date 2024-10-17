
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const response = {
    "a": "From the import page.",
    "r": {
        "buttons": [
            {
                "text": "Tell me about the Alexa Show.",
                "value": "The Echo Show"
            },
            {
                "text": "Tell me about the Echo Dot",
                "value": "The Echo Dot"
            }
        ],
        "imageUrl": "https://xyz-amazon.com/images/I/61bze1_SL124_.jpg",
        "title": "Alexa"
    },
    "t": "import",
    "elicitResponse": {
        "responsebot_hook": "QnAYesNoBot"
    },
    "alt": {
        "markdown": "*From the import page.*",
        "ssml": "<speak>From the import page.</speak>"
    },
    "type": "qna",
    "quniqueterms": "How do I import?",
    "qid": "Import.002",
    "sa": [
        {
            "enableTranslate": true,
            "text": "TestName",
            "value": "TestValue"
        },
        {
            "enableTranslate": true,
            "text": "TestName2",
            "value": "TestValue2"
        }
    ],
    "clientFilterValues": "Test",
    "q": [
        "How do I import?",
        "How do I use QnaBot?"
    ]
};


function lexQaResponse() {
    return response;
};

exports.lexQaResponse = lexQaResponse;