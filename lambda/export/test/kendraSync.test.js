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

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { performSync } = require('../kendraSync');
const { mockClient } = require('aws-sdk-client-mock');
const s3Mock = mockClient(S3Client);
const { Readable } = require('stream');
const { sdkStreamMixin } = require('@smithy/util-stream');
const createFAQ = require('../createFAQ');
const parseJSON = require('../parseJSON');
require('aws-sdk-client-mock-jest');
const qnabotSettings = require('qnabot/settings');
jest.mock('../createFAQ');
jest.mock('../parseJSON');

const faqResponse = { "Id": "test-11e1a435a695" };

let config;
const event = {
    Records: [
        {
            s3: {
                bucket: {
                    name: "exportBucket",
                },
                object: {
                    key: "status/testExport.csv",
                    versionId: "tLkWAhY8v2rsaSPWqg2m",
                }
            }
        }
    ]
};

describe('when calling performSync function', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        process.env = { ...OLD_ENV };
        s3Mock.reset();
    });
    
    afterEach(() => {
        process.env = OLD_ENV;
        s3Mock.restore();
        jest.clearAllMocks();
    });

    it('should update multiples statuses and complete sync', async () => {
        process.env.REGION = 'us-east-1';
        process.env.OUTPUT_S3_BUCKET = 'testExportBucket' ;
        process.env.KENDRA_ROLE = 'testKendraRole'
        
        parseJSON.handler.mockResolvedValue();
        createFAQ.handler.mockResolvedValue(faqResponse);
        jest.spyOn(qnabotSettings, 'merge_default_and_custom_settings').mockResolvedValue({ KENDRA_FAQ_INDEX: 'test-d06e966cf73d' });

        config = { 
            content : {
                "a": "resetLang",
                "type": "qna",
                "qid": "001",
                "q": [
                "Reset"
                ],
                "enableQidIntent":true
            }
        };
        const stream = new Readable();
        stream.push(JSON.stringify(config));
        stream.push(null);
        const sdkStream1 = sdkStreamMixin(stream);

        config = { status: 'Parsing content JSON'}
        const stream2 = new Readable();
        stream2.push(JSON.stringify(config));
        stream2.push(null);
        const sdkStream2 = sdkStreamMixin(stream2);

        config = { status: 'Creating FAQ'}
        const stream3 = new Readable();
        stream3.push(JSON.stringify(config));
        stream3.push(null);
        const sdkStream3 = sdkStreamMixin(stream3);

        config = { status: 'Sync Complete'}
        const stream4 = new Readable();
        stream4.push(JSON.stringify(config));
        stream4.push(null);
        const sdkStream4 = sdkStreamMixin(stream4);

        s3Mock.on(GetObjectCommand).resolvesOnce({ Body: sdkStream1 }).resolvesOnce({ Body: sdkStream2 }).resolvesOnce({ Body: sdkStream3 }).resolvesOnce({ Body: sdkStream4});
        s3Mock.on(PutObjectCommand).resolves({});
        
        const result = await performSync(event, null, null);
        expect(result).toBe('Synced');
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 4);
        expect(s3Mock).toHaveReceivedNthCommandWith(2, GetObjectCommand, {"Bucket": "exportBucket", "Key": "status/testExport.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"});
        expect(s3Mock).toHaveReceivedNthCommandWith(3, GetObjectCommand, {"Body": "{\"status\":\"Parsing content JSON\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});
        expect(s3Mock).toHaveReceivedNthCommandWith(5, GetObjectCommand, {"Body": "{\"status\":\"Creating FAQ\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});
        expect(s3Mock).toHaveReceivedNthCommandWith(7, GetObjectCommand, {"Body": "{\"status\":\"Sync Complete\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 3);
        expect(s3Mock).toHaveReceivedNthCommandWith(4, PutObjectCommand, {"Body": "{\"status\":\"Parsing content JSON\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});
        expect(s3Mock).toHaveReceivedNthCommandWith(6, PutObjectCommand, {"Body": "{\"status\":\"Creating FAQ\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});
        expect(s3Mock).toHaveReceivedNthCommandWith(8, PutObjectCommand, {"Body": "{\"status\":\"Sync Complete\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});
    });

    it('should respond without kendra faq index and update status to Error', async () => {
        process.env.REGION = 'us-east-1';
        process.env.OUTPUT_S3_BUCKET = 'testExportBucket' ;
        process.env.KENDRA_ROLE = 'testKendraRole'
        
        parseJSON.handler.mockResolvedValue();
        createFAQ.handler.mockResolvedValue(faqResponse);
        jest.spyOn(qnabotSettings, 'merge_default_and_custom_settings').mockResolvedValue({ KENDRA_FAQ_INDEX: '' });

        const params = { 
            content : {
                "a": "resetLang",
                "type": "qna",
                "qid": "001",
                "q": [
                "Reset"
                ],
                "enableQidIntent":true
            }
        };
        const stream = new Readable();
        stream.push(JSON.stringify(params));
        stream.push(null);
        const sdkStream1 = sdkStreamMixin(stream);

        config = { status: 'Parsing content JSON'}
        const stream2 = new Readable();
        stream2.push(JSON.stringify(config));
        stream2.push(null);
        const sdkStream2 = sdkStreamMixin(stream2);

        config = { status: 'Error'}
        const stream3 = new Readable();
        stream3.push(JSON.stringify(config));
        stream3.push(null);
        const sdkStream3 = sdkStreamMixin(stream3);

        s3Mock.on(GetObjectCommand).resolvesOnce({ Body: sdkStream1 }).resolvesOnce({ Body: sdkStream2 }).resolvesOnce({ Body: sdkStream3 })
        s3Mock.on(PutObjectCommand).resolves({});
        
        const error = new Error(`No FAQ Index set: `);
        await expect( performSync(event, null, null)).resolves.toThrowError(error);
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 3);
        expect(s3Mock).toHaveReceivedNthCommandWith(2, GetObjectCommand, {"Bucket": "exportBucket", "Key": "status/testExport.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"});
        expect(s3Mock).toHaveReceivedNthCommandWith(3, GetObjectCommand, {"Body": "{\"status\":\"Parsing content JSON\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});
        expect(s3Mock).toHaveReceivedNthCommandWith(5, GetObjectCommand, {"Body": "{\"status\":\"Error\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 2);
        expect(s3Mock).toHaveReceivedNthCommandWith(4, PutObjectCommand, {"Body": "{\"status\":\"Parsing content JSON\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});
        expect(s3Mock).toHaveReceivedNthCommandWith(6, PutObjectCommand, {"Body": "{\"status\":\"Error\"}", "Bucket": "testExportBucket", "Key": "status/qna-kendra-faq.txt"});

    });

    it('should handle an error', async () => {
        const error = new Error('error');
        s3Mock.on(GetObjectCommand).rejects(error);
        await expect( performSync(event, null, null)).rejects.toThrowError(error);
	});
});