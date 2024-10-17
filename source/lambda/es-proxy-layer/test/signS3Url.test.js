/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const presigner = require('@aws-sdk/s3-request-presigner'); // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const { signUrl } = require('../lib/signS3URL');
const _ = require('lodash');

jest.mock('qnabot/settings');
jest.mock('qnabot/logging');
jest.mock('@aws-sdk/s3-request-presigner');
presigner.getSignedUrl.mockImplementation(() => {
    return 'https://signedurl.s3.amazonaws.com/'
});


describe('signS3URL', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('evaluate signS3URL condition', async () => {
        const url = 'https://qna.s3.amazonaws.com/test.json';
        const signedUrl = await signUrl(url, 300);
        expect(signedUrl).toBe("https://signedurl.s3.amazonaws.com/");
        expect(presigner.getSignedUrl).toBeCalledTimes(1);
    });

    test('evaluate signS3URL condition with non-s3 url', async () => {
        const url = 'https://nots3url.com'; 
        const signedUrl = await signUrl(url, 300);
        expect(signedUrl).toBe(url);
        expect(presigner.getSignedUrl).toBeCalledTimes(0);
    });

});



