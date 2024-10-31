/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { FirehoseClient, PutRecordCommand } = require('@aws-sdk/client-firehose');
const { mockClient } = require('aws-sdk-client-mock');
const firehoseMock = mockClient(FirehoseClient);
require('aws-sdk-client-mock-jest');
// Mock the required modules
jest.mock('@aws-sdk/client-firehose');
jest.mock('sdk-config/customSdkConfig', () => jest.fn());
jest.mock('qnabot/logging', () => ({
    log: jest.fn(),
    redact_text: jest.fn((text) => 'My card is XXXXXX'),
    setPIIRedactionEnvironmentVars: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('qnabot/settings', () => ({
    set_environment_variables: jest.fn()
}));

const esLoggingHandler = require('../lib/es-logging');

describe('ES Logging Module', () => {
    let mockEvent, mockContext, mockCallback;

    beforeEach(() => {
        mockEvent = {
            req: {
                _settings: {},
                _event: {
                    inputTranscript: 'My card is 1111-1111-1111-1111',
                    transcriptions: [
                        {
                            transcription: 'My card is 1111-1111-1111-1111'
                        }
                    ]
                }
            },
            res: {
                session: {
                    token: 'ey232lH'
                }
            }
        };

        firehoseResponse = {
            "$metadata": {
                "httpStatusCode": 200,
                "requestId": "0e70b57ba37e",
                "extendedRequestId": "Y4V1PzvLiN5MC7lZlRu",
                "attempts": 1,
                "totalRetryDelay": 0
            },
            "Encrypted": true,
            "RecordId": "A21DPK4aJIABF01plJJSoPcK0P4+RXc"
        }
        process.env.FIREHOSE_NAME = 'mock-firehose-name';
        mockContext = {};
        mockCallback = jest.fn();
        jest.clearAllMocks();
        firehoseMock.reset();
    });


    afterEach(() => {
        firehoseMock.restore();
    });

    test('handler with cloudwatch logging disabled', async () => {
        mockEvent.req._settings.DISABLE_CLOUDWATCH_LOGGING = true;
        firehoseMock.on(PutRecordCommand).resolvesOnce(firehoseResponse)

        await esLoggingHandler(mockEvent, mockContext, mockCallback);
        expect(require('qnabot/logging').log).toHaveBeenCalledWith('RESULT', 'cloudwatch logging disabled');
        expect(firehoseMock).toHaveReceivedCommandTimes(PutRecordCommand, 1);
    });

    test('handler with redaction enabled', async () => {
        mockEvent.req._settings.ENABLE_REDACTING = true;
        firehoseMock.on(PutRecordCommand).resolvesOnce(firehoseResponse)

        await esLoggingHandler(mockEvent, mockContext, mockCallback);

        const result = {
            req: {
                _settings: {
                    ENABLE_REDACTING: true
                },
                _event: {
                    inputTranscript: 'My card is XXXXXX',
                    transcriptions: [
                        {
                            transcription: 'My card is XXXXXX'
                        }
                    ]
                }
            },
            res: {
                session: {
                    token:  '<token redacted>'
                }
            }
        };
        
        expect(require('qnabot/logging').log).toHaveBeenCalledWith('REDACTED RESULT', JSON.stringify(result, null, 2));
        expect(firehoseMock).toHaveReceivedCommandTimes(PutRecordCommand, 1);
    });

    test('handler without redaction', async () => {
        firehoseMock.on(PutRecordCommand).resolvesOnce(firehoseResponse)
        await esLoggingHandler(mockEvent, mockContext, mockCallback);
        const result = {
            req: {
                _settings: {
                },
                _event: {
                    inputTranscript: 'My card is 1111-1111-1111-1111',
                    transcriptions: [
                        {
                            transcription: 'My card is 1111-1111-1111-1111'
                        }
                    ]
                }
            },
            res: {
                session: {
                    token:  '<token redacted>'
                }
            }
        };
        expect(require('qnabot/logging').log).toHaveBeenCalledWith('RESULT', JSON.stringify(result, null, 2));
        expect(firehoseMock).toHaveReceivedCommandTimes(PutRecordCommand, 1);
    });

});
