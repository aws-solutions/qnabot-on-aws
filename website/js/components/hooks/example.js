/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const session = {
    previous: JSON.stringify({
        qid: 'test.1',
        q: 'help',
        a: 'ask a question',
    }),
};

module.exports = {
    req: {
        _type: 'LEX',
        question: 'help',
        session,
        _info: {
            es: {
                address: 'elastic search address',
                index: 'QnABot index in elasticsearch',
                type: 'QnABot type in elasticsearch',
                service: {
                    qid: 'Arn of ES qid lambda',
                    proxy: 'Arn of ES proxy lambda',
                },
            },
        },
        _original: {
            currentIntent: {
                name: 'intent-name',
                slots: {
                    'slot-name': 'value',
                },
                confirmationStatus: 'None, Confirmed, or Denied (intent confirmation, if configured)',
            },
            bot: {
                name: 'bot-name',
                alias: 'bot-alias',
                version: 'bot-version',
            },
            userId: 'user-id specified in the POST request to Amazon Lex.',
            inputTranscript: 'help',
            invocationSource: 'FulfillmentCodeHook or DialogCodeHook',
            outputDialogMode: 'Text or Voice, based on ContentType request header in runtime API request',
            messageVersion: '1.0',
            sessionAttributes: session,
        },
    },
    res: {
        type: 'plaintext',
        message: '',
        session: {
            key1: 'value1',
            key2: 'value2',
        },
        card: {
            send: false,
            title: '',
            text: '',
            url: '',
        },
    },
};
