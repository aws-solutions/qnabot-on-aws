/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
                address: 'OpenSearch address',
                index: 'QnABot index in OpenSearch',
                type: 'QnABot type in OpenSearch',
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
