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

require("aws-sdk-client-mock-jest");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const s3ClientMock = mockClient(S3Client);
const response = require('cfn-response');
const { handler } = require('../cfn');

jest.mock('cfn-response', () => {
    const originalModule = jest.requireActual('cfn-response');
    return {
        __esModule: true,
        ...originalModule,
        send: jest.fn(),
    };
});

const event = {
    RequestType: 'Create',
    ResourceProperties: {
        Bucket: 'test-bucket',
    },
    ResponseURL: 'localhost',
};

const context = {
    Context: 'test',
};

const callback = jest.fn();

describe('cfn handler', () => {
    beforeEach(() => {
        jest.resetModules();
        s3ClientMock.reset();
        callback.mockRestore();
    });

    it('should put objects in S3', () => {
        s3ClientMock.on(PutObjectCommand).resolves({ result: 'SUCCESS' });
        handler(event, context, callback);
        expect(s3ClientMock).toHaveReceivedCommandWith(PutObjectCommand, {
            Bucket: "test-bucket",
        });
    });

    it('should send success response to cloudformation on delete', () => {
        const clonedEvent = JSON.parse(JSON.stringify(event));
        clonedEvent.RequestType = 'Delete';
        handler(clonedEvent, context, callback);
        expect(s3ClientMock).toHaveReceivedCommandTimes(PutObjectCommand, 0);
    });

    it('should execute callback function if no url provided', () => {
        s3ClientMock.on(PutObjectCommand).resolves({ result: 'SUCCESS' });
        const clonedEvent = JSON.parse(JSON.stringify(event));
        clonedEvent.ResponseURL = undefined;

        handler(clonedEvent, context, callback);
    });

    it('should handle errors from S3 client', () => {
        s3ClientMock.rejects('mocked rejection');
        handler(event, context, callback);
        expect(s3ClientMock).toHaveReceivedCommandWith(PutObjectCommand, {
            Bucket: "test-bucket",
        });
    });
});
