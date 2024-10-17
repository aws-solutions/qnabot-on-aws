 /** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { S3Client, waitUntilObjectExists, GetObjectCommand } = require('@aws-sdk/client-s3');
const { delete_existing_content } = require('../delete_existing_content');
const { mockClient } = require('aws-sdk-client-mock');
const s3Mock = mockClient(S3Client);
const lambdaMock = mockClient(LambdaClient);
const { Readable } = require('stream');
const { sdkStreamMixin } = require('@smithy/util-stream');
const qnabot = require('qnabot/logging');
require('aws-sdk-client-mock-jest');

const config = {
    EsErrors: [],
    status: 'InProgress',
    bucket: 'qna-test-importbucket',
    key: 'data/import-pass.xlsx',
    version: 'testVersion',
  };

const esIndex =  "qna-test";

const es_formatted_content = {
  index: {
    _index: "qna-test",
    _id: "Import.001"
  },
  a: "JSON and xlsx.",
  qid: "Import.001",
  type: "qna",
  questions: [
    {
      q: "Which file formats are supported by the QnA Bot question designer import?"
    }
  ],
  quniqueterms: "Which file formats are supported by the QnA Bot question designer import?",
  datetime: "2023-01-02T00:00:00.000Z",
};

describe('when calling delete_existing_content function', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        process.env = { ...OLD_ENV };
        qnabot.log = jest.fn();
        s3Mock.reset();
        lambdaMock.reset();
    });
    
    afterEach(() => {
        process.env = OLD_ENV;
        s3Mock.restore();
        lambdaMock.restore();
        jest.clearAllMocks();
    });

    it('should invoke lambda when delete_existing_content is true', async () => {
      process.env.ES_ENDPOINT = 'testEndpoint' ;
      process.env.ES_PROXY = 'testESProxy'
      const mockOptions = {
        import_datetime: '2023-01-02T00:00:00.000Z',
        options: {
          delete_existing_content : true
        },
      };

      const stream1 = new Readable();
      stream1.push(JSON.stringify(mockOptions));
      stream1.push(null);
      const sdkStream1 = sdkStreamMixin(stream1);

      const responsePayload = {
        endpoint: process.env.ES_ENDPOINT,
        method: 'POST',
        path: `${esIndex}/_delete_by_query?conflicts=proceed&refresh=true`,
        body: '{"query":{"match_all":{}}}',
      };

      s3Mock.on(GetObjectCommand).resolvesOnce({ Body: sdkStream1, LastModified: '2023-01-04T00:00:00.000Z' });
      lambdaMock.on(InvokeCommand).resolvesOnce({ Payload: JSON.stringify(responsePayload) });
      await delete_existing_content(esIndex, config, es_formatted_content);
      expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
      expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "qna-test-importbucket", "Key": "options/import-pass.xlsx"});
      expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
      expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, {"FunctionName": "testESProxy", "Payload": "{\"endpoint\":\"testEndpoint\",\"method\":\"POST\",\"path\":\"qna-test/_delete_by_query?conflicts=proceed&refresh=true\",\"body\":\"{\\\"query\\\":{\\\"match_all\\\":{}}}\"}"});
    });

    it('should get the object again and check if the file in S3 is the latest that needs to be used', async () => {
      process.env.ES_ENDPOINT = 'testEndpoint' ;
      process.env.ES_PROXY = 'testESProxy'
      
      const mockOptions1 = {
        import_datetime: '2023-01-02T00:00:00.000Z',
        options: {
          delete_existing_content : false
        },
      };
      const stream1 = new Readable();
      stream1.push(JSON.stringify(mockOptions1));
      stream1.push(null);
      const sdkStream1 = sdkStreamMixin(stream1);

      const mockOptions2 = {
        import_datetime: '2023-01-03T00:00:00.000Z',
        options: {
          delete_existing_content : false
        },
      };
      const stream2 = new Readable();
      stream2.push(JSON.stringify(mockOptions2));
      stream2.push(null);
      const sdkStream2 = sdkStreamMixin(stream2);

      s3Mock.on(GetObjectCommand).resolvesOnce({ Body: sdkStream1, LastModified: '2023-01-01T00:00:00.000Z' }).resolvesOnce({ Body: sdkStream2, LastModified: '2023-01-04T00:00:00.000Z' });
      await delete_existing_content(esIndex, config, es_formatted_content);
      expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 2);
      expect(s3Mock).toHaveReceivedNthCommandWith(2, GetObjectCommand, {"Bucket": "qna-test-importbucket", "Key": "options/import-pass.xlsx"});
      expect(s3Mock).toHaveReceivedNthCommandWith(3, GetObjectCommand, {"Bucket": "qna-test-importbucket", "Key": "options/import-pass.xlsx"});
    });

    it('should handle an error from GetObjectCommand', async () => {
        const error = new Error('error');
        s3Mock.on(GetObjectCommand).rejects(error);
        await expect( delete_existing_content(esIndex, config, es_formatted_content)).rejects.toThrowError(error);
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
	  });

    it('should handle an error from waitUntilObjectExists', async () => {
      const error = new Error('error');
      s3Mock.on(waitUntilObjectExists).rejects(error);
      await delete_existing_content(esIndex, config, es_formatted_content);
      expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 0);
      expect(qnabot.log).toHaveBeenCalledWith('No import options file (options/import-pass.xlsx) - expected only if import process is initiated via the QnABot CLI.');
    });
});