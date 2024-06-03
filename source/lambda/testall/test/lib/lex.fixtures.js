
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