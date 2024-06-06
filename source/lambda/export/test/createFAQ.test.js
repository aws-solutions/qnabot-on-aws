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
const { KendraClient, CreateFaqCommand, DescribeFaqCommand, DeleteFaqCommand, ListFaqsCommand } = require('@aws-sdk/client-kendra');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const s3Mock = mockClient(S3Client);
const kendraMock = mockClient(KendraClient);
const { handler } = require('../createFAQ');
const qnabot = require('qnabot/logging');
require('aws-sdk-client-mock-jest');

describe('when calling creatFAQ function', () => {
    beforeEach(() => {
        s3Mock.reset();
        kendraMock.reset();
        qnabot.log = jest.fn();
    });
    
    afterEach(() => {
        s3Mock.restore();
        kendraMock.restore();
        jest.clearAllMocks();
    });

    const params = {
        faq_name: 'qna-facts',
        faq_index_id: 'test-cb985cee41f5',
        json_path: './test/qna_FAQ.json',
        json_name: 'qna_FAQ.json',
        s3_bucket: 'qna-dev-exportbucket-2h0i5izlpxuh',
        s3_key: 'kendra_json/qna_FAQ.json',
        kendra_s3_access_role: 'arn:aws:iam::123456789012:role/QNA-dev-ExportStack-MLU-KendraS3Role-3TQzkkUg',
        region: 'us-west-2'
    };

    it('should return faq response successfully', async () => {
        s3Mock.on(PutObjectCommand).resolves({ "VersionId": "fKEpmicnDsr0WxG.AIqF1yZXLv2tkVt9" });
        kendraMock.on(ListFaqsCommand).resolves({ FaqSummaryItems: [] });
        kendraMock.on(CreateFaqCommand).resolves({ Id: 'bd506444-d50c-425r-97df-16094d587a0d' });
        kendraMock.on(DescribeFaqCommand).resolves({
            FileFormat: 'JSON',
            Id: 'bd506444-d50c-425r-97df-16094d587a0d',
            IndexId: 'test-cb985cee41f5',
            LanguageCode: 'en',
            Name: 'qna-facts',
            RoleArn: 'arn:aws:iam::123456789012:role/QNA-dev-ExportStack-MLU-KendraS3Role-3TQzkkUg',
            S3Path: {
              Bucket: 'qna-dev-exportbucket-2h0i5izlpxuh',
              Key: 'kendra_json/qna_FAQ.json'
            },
        });
        const result = await handler(params);
        expect(result).toStrictEqual({ Id: 'bd506444-d50c-425r-97df-16094d587a0d' });
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(kendraMock).toHaveReceivedCommandTimes(ListFaqsCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(ListFaqsCommand, {"IndexId": "test-cb985cee41f5", "MaxResults": 30});
        expect(kendraMock).toHaveReceivedCommandTimes(CreateFaqCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(CreateFaqCommand, {"Description": "Exported FAQ of questions from QnABot designer console", "FileFormat": "JSON", "IndexId": "test-cb985cee41f5", "Name": "qna-facts", "RoleArn": "arn:aws:iam::123456789012:role/QNA-dev-ExportStack-MLU-KendraS3Role-3TQzkkUg", "S3Path": {"Bucket": "qna-dev-exportbucket-2h0i5izlpxuh", "Key": "kendra_json/qna_FAQ.json"}});
        expect(kendraMock).toHaveReceivedCommandTimes(DescribeFaqCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(DescribeFaqCommand, {"Id": "bd506444-d50c-425r-97df-16094d587a0d", "IndexId": "test-cb985cee41f5"});
	});

    it('should return faq response when faq summary items is not empty', async () => {
        s3Mock.on(PutObjectCommand).resolves({ "VersionId": "fKEpmicnDsr0WxG.AIqF1yZXLv2tkVt9" });
        kendraMock.on(ListFaqsCommand).resolves({ FaqSummaryItems: [{ Name: 'qna-facts', Id : 'bd506444-d50c-425r-97df-16094d587a0d'} ] });
        kendraMock.on(CreateFaqCommand).resolves({ Id: 'bd506444-d50c-425r-97df-16094d587a0d' });
        kendraMock.on(DeleteFaqCommand).resolves({});
        kendraMock.on(DescribeFaqCommand).resolves({
            FileFormat: 'JSON',
            Id: 'bd506444-d50c-425r-97df-16094d587a0d',
            IndexId: 'test-cb985cee41f5',
            LanguageCode: 'en',
            Name: 'qna-facts',
            RoleArn: 'arn:aws:iam::123456789012:role/QNA-dev-ExportStack-MLU-KendraS3Role-3TQzkkUg',
            S3Path: {
              Bucket: 'qna-dev-exportbucket-2h0i5izlpxuh',
              Key: 'kendra_json/qna_FAQ.json'
            },
        });
        const result = await handler(params);
        expect(result).toStrictEqual({ Id: 'bd506444-d50c-425r-97df-16094d587a0d' });
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(kendraMock).toHaveReceivedCommandTimes(ListFaqsCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(ListFaqsCommand, {"IndexId": "test-cb985cee41f5", "MaxResults": 30});
        expect(kendraMock).toHaveReceivedCommandTimes(CreateFaqCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(CreateFaqCommand, {"Description": "Exported FAQ of questions from QnABot designer console", "FileFormat": "JSON", "IndexId": "test-cb985cee41f5", "Name": "qna-facts", "RoleArn": "arn:aws:iam::123456789012:role/QNA-dev-ExportStack-MLU-KendraS3Role-3TQzkkUg", "S3Path": {"Bucket": "qna-dev-exportbucket-2h0i5izlpxuh", "Key": "kendra_json/qna_FAQ.json"}});
        expect(kendraMock).toHaveReceivedCommandTimes(DeleteFaqCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(DeleteFaqCommand, {"Id": "bd506444-d50c-425r-97df-16094d587a0d", "IndexId": "test-cb985cee41f5"});
        expect(kendraMock).toHaveReceivedCommandTimes(DescribeFaqCommand, 2);
        expect(kendraMock).toHaveReceivedNthCommandWith(3, DescribeFaqCommand, {"Id": "bd506444-d50c-425r-97df-16094d587a0d", "IndexId": "test-cb985cee41f5"});
        expect(kendraMock).toHaveReceivedNthCommandWith(5, DescribeFaqCommand, {"Id": "bd506444-d50c-425r-97df-16094d587a0d", "IndexId": "test-cb985cee41f5"});
	});

    it('should handle a listFaq error', async () => {
        const error = new Error('error');
        s3Mock.on(PutObjectCommand).resolves({ "VersionId": "fKEpmicnDsr0WxG.AIqF1yZXLv2tkVt9" });
        kendraMock.on(ListFaqsCommand).rejects(error);
        await expect(handler(params)).rejects.toThrowError(error);
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
	});

    it('should handle a describeFaq error', async () => {
        const error = new Error('error');
        s3Mock.on(PutObjectCommand).resolves({ "VersionId": "fKEpmicnDsr0WxG.AIqF1yZXLv2tkVt9" });
        kendraMock.on(ListFaqsCommand).resolves({ FaqSummaryItems: [] });
        kendraMock.on(CreateFaqCommand).resolves({ Id: 'bd506444-d50c-425r-97df-16094d587a0d' });
        kendraMock.on(DescribeFaqCommand).rejects(error);
        await expect(handler(params)).rejects.toThrowError(new Error('Could not sync Kendra FAQ'));
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(kendraMock).toHaveReceivedCommandTimes(ListFaqsCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(ListFaqsCommand, {"IndexId": "test-cb985cee41f5", "MaxResults": 30});
        expect(kendraMock).toHaveReceivedCommandTimes(CreateFaqCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(CreateFaqCommand, {"Description": "Exported FAQ of questions from QnABot designer console", "FileFormat": "JSON", "IndexId": "test-cb985cee41f5", "Name": "qna-facts", "RoleArn": "arn:aws:iam::123456789012:role/QNA-dev-ExportStack-MLU-KendraS3Role-3TQzkkUg", "S3Path": {"Bucket": "qna-dev-exportbucket-2h0i5izlpxuh", "Key": "kendra_json/qna_FAQ.json"}});
        expect(kendraMock).toHaveReceivedCommandTimes(DescribeFaqCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(DescribeFaqCommand, {"Id": "bd506444-d50c-425r-97df-16094d587a0d", "IndexId": "test-cb985cee41f5"});
	});

    it('should handle a createFaq error', async () => {
        const error = new Error('error');
        s3Mock.on(PutObjectCommand).resolves({ "VersionId": "fKEpmicnDsr0WxG.AIqF1yZXLv2tkVt9" });
        kendraMock.on(ListFaqsCommand).resolves({ FaqSummaryItems: [] });
        kendraMock.on(CreateFaqCommand).rejects(error);
        await expect(handler(params)).rejects.toThrowError(error);
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(kendraMock).toHaveReceivedCommandTimes(ListFaqsCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(ListFaqsCommand, {"IndexId": "test-cb985cee41f5", "MaxResults": 30});
        expect(kendraMock).toHaveReceivedCommandTimes(CreateFaqCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(CreateFaqCommand, {"Description": "Exported FAQ of questions from QnABot designer console", "FileFormat": "JSON", "IndexId": "test-cb985cee41f5", "Name": "qna-facts", "RoleArn": "arn:aws:iam::123456789012:role/QNA-dev-ExportStack-MLU-KendraS3Role-3TQzkkUg", "S3Path": {"Bucket": "qna-dev-exportbucket-2h0i5izlpxuh", "Key": "kendra_json/qna_FAQ.json"}});
	});

    it('should handle a deleteFaq error', async () => {
        const error = new Error('error');
        s3Mock.on(PutObjectCommand).resolves({ "VersionId": "fKEpmicnDsr0WxG.AIqF1yZXLv2tkVt9" });
        kendraMock.on(ListFaqsCommand).resolves({ FaqSummaryItems: [{ Name: 'qna-facts', Id : 'bd506444-d50c-425r-97df-16094d587a0d'} ] });
        kendraMock.on(DeleteFaqCommand).rejects(error);
        await expect(handler(params)).rejects.toThrowError(error);
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(kendraMock).toHaveReceivedCommandTimes(ListFaqsCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(ListFaqsCommand, {"IndexId": "test-cb985cee41f5", "MaxResults": 30});
        expect(kendraMock).toHaveReceivedCommandTimes(DeleteFaqCommand, 1);
        expect(kendraMock).toHaveReceivedCommandWith(DeleteFaqCommand, {"Id": "bd506444-d50c-425r-97df-16094d587a0d", "IndexId": "test-cb985cee41f5"});
	});

    it('should handle an s3 putObj error, check for throttling condition and log throttling exception', async () => {
        const e1 = new Error('throttling error');
        e1.name = 'ThrottlingException';
        const e2 = new Error('not a throttling error');
        s3Mock.on(PutObjectCommand).rejectsOnce(e1).rejects(e2);
        await expect(handler(params)).rejects.toThrowError(e2);
        expect(qnabot.log).toHaveBeenCalledWith('Throttling exception: trying s3Uploader again in 10 seconds');
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 2);
	});

});