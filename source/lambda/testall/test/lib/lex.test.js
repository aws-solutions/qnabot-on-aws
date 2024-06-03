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

const { LexRuntimeV2Client, RecognizeTextCommand } = require('@aws-sdk/client-lex-runtime-v2');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const lex = require('../../lib/lex');
const s3Mock = mockClient(S3Client);
const lexMock = mockClient(LexRuntimeV2Client);
const { mockStream } = require('../index.fixtures');
const lexFixtures = require('./lex.fixtures');
require('aws-sdk-client-mock-jest');

const config = {
    parts: [{ key: 'testKey', version: 'testVersion', type: 'qna'}],
    bucket: 'testBucket',
    filter: 'testFilter',
    token: 'testToken',
    key: 'testKey',
    status: 'testStatus',
    version: 'testVersion',
    locale: 'en_US',
};

describe('when calling lex function', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        process.env = { ...OLD_ENV };
        s3Mock.reset();
        lexMock.reset();
    });
    
    afterEach(() => {
        process.env = OLD_ENV;
        s3Mock.restore();
        lexMock.restore();
        jest.clearAllMocks();
    });

    it('should process data with lex', async() => {
        mockStream(config, s3Mock);
        lexMock.on(RecognizeTextCommand).resolves({
            sessionState: { sessionAttributes: { qnabot_qid : 'test qid' } },
            messages: [{ content: Buffer.from('test message') }]
        });
        
        await expect(lex(config)).resolves.not.toThrow()
        expect(config.status).toEqual('Clean');
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(lexMock).toHaveReceivedCommandTimes(RecognizeTextCommand, 0);
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "testBucket", "Key": "testKey", "VersionId": "testVersion" });
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {"Body": "Match(Yes/No), Question, Topic, QID, Returned QID, Returned Message\n", "Bucket": "testBucket", "Key": "testKey"});
    });

    it('should test that processWithLex processes data correctly', async() => {
        const config = {
            parts: [{ key: 'tmp/TestAll.csv/1', version: 'Ew5SVJNfaLYjlTLKO73tjFPAWh5vWJh'}],
            bucket: 'testBucket',
            index: 'testIndex',
            tmp: 'tmp/TestAll.csv',
            filter: 'testFilter',
            token: 'testToken',
            key: 'testKey',
            status: 'Lex',
            version: 'testVersion',
            locale: 'en_US',
        };
        process.env.LEXV2_BOT_ID = 'testId';
        process.env.LEXV2_BOT_ALIAS_ID = 'testAliasId';
        const params = lexFixtures.lexQaResponse();

        mockStream(params, s3Mock);

        lexMock.on(RecognizeTextCommand).resolves({
            sessionState: { sessionAttributes: { qnabot_qid : 'test qid' } },
            messages: [{ content: Buffer.from('test message') }]
        });

        await lex(config);
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(lexMock).toHaveReceivedCommandTimes(RecognizeTextCommand, 2);
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "testBucket", "Key": "tmp/TestAll.csv/1", "VersionId": "testVersion" });
        expect(lexMock).toHaveReceivedNthCommandWith(1, RecognizeTextCommand, {"botAliasId": "testAliasId", "botId": "testId", "localeId": "en_US", "sessionId": "automated-tester1", "sessionState": {"sessionAttributes": {"idtokenjwt": "testToken", "topic": "import"}}, "text": "How do I import?"});
        expect(lexMock).toHaveReceivedNthCommandWith(2, RecognizeTextCommand, {"botAliasId": "testAliasId", "botId": "testId", "localeId": "en_US", "sessionId": "automated-tester1", "sessionState": {"sessionAttributes": {"idtokenjwt": "testToken", "topic": "import"}}, "text": "How do I use QnaBot?"});
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {'Body': "Match(Yes/No), Question, Topic, QID, Returned QID, Returned Message\n" +
        'No,How do I import?,import,Import.002,test qid,"test message"\n' +
        'No,How do I use QnaBot?,import,Import.002,test qid,"test message"\n', 'Bucket': "testBucket", 'Key': 'testKey'});
    });

    it('should handle an error', async() => {
        mockStream(config, s3Mock);
        lexMock.on(RecognizeTextCommand).resolves({
            sessionState: { sessionAttributes: { qnabot_qid : 'test qid' } },
            messages: [{ content: Buffer.from('test message') }]
        });

        const error = new Error('putObj error');
        s3Mock.on(PutObjectCommand).rejects(error)
        const response = lex(config);
        await expect(response).rejects.toThrowError('putObj error');
    });
})


