/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

require('aws-sdk-client-mock-jest');
const { S3Client, ListObjectsCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const s3ClientMock = mockClient(S3Client);
const { handler } = require('../handler');

describe('lex poll', () => {
    beforeEach(() => {
        jest.resetModules();
        s3ClientMock.reset();
    });

    it('returns sorted list of routes', async () => {
        const event = {
            bucket: 'test-bucket',
            prefix: 'test-prefix',
            perpage: 10,
            token: 'test-token',
            root: 'http://localhost',
            type: 'test',
        };

        s3ClientMock.on(ListObjectsCommand).resolves({
            Contents: [
                {
                    LastModified: '2019-11-01T23:11:50.000Z',
                    Key: 'doc2.rtf',
                },
                {
                    LastModified: '2019-11-03T23:11:50.000Z',
                    Key: 'doc4.rtf',
                },
                {
                    LastModified: '2019-11-02T23:11:50.000Z',
                    Key: 'doc3.rtf',
                },
                {
                    Key: 'doc1.rtf',
                },
            ],
        });

        const result = await handler(event, {});

        expect(s3ClientMock).toHaveReceivedNthCommandWith(1, ListObjectsCommand, {
            Bucket: 'test-bucket',
            Marker: 'test-token',
            Prefix: 'test-prefix',
            MaxKeys: 10,
        });

        expect(result).toEqual({
            jobs: [
                {
                    id: 'doc4.rtf',
                    href: 'http://localhost/jobs/test/doc4.rtf',
                },
                {
                    id: 'doc3.rtf',
                    href: 'http://localhost/jobs/test/doc3.rtf',
                },
                {
                    id: 'doc2.rtf',
                    href: 'http://localhost/jobs/test/doc2.rtf',
                },
                {
                    id: 'doc1.rtf',
                    href: 'http://localhost/jobs/test/doc1.rtf',
                },
            ],
        });
    });

    it('returns sorted list of routes using default event params', async () => {
        const event = {
            bucket: 'test-bucket',
            prefix: 'test-prefix',
            root: 'http://localhost',
            type: 'test',
        };

        s3ClientMock.on(ListObjectsCommand).resolves({
            Contents: [
                {
                    LastModified: '2019-11-01T23:11:50.000Z',
                    Key: 'doc2.rtf',
                },
                {
                    LastModified: '2019-11-03T23:11:50.000Z',
                    Key: 'doc4.rtf',
                },
                {
                    LastModified: '2019-11-02T23:11:50.000Z',
                    Key: 'doc3.rtf',
                },
                {
                    Key: 'doc1.rtf',
                },
            ],
        });

        const result = await handler(event, {});

        expect(s3ClientMock).toHaveReceivedNthCommandWith(1, ListObjectsCommand, {
            Bucket: 'test-bucket',
            Marker: null,
            Prefix: 'test-prefix',
            MaxKeys: 100,
        });

        expect(result).toEqual({
            jobs: [
                {
                    id: 'doc4.rtf',
                    href: 'http://localhost/jobs/test/doc4.rtf',
                },
                {
                    id: 'doc3.rtf',
                    href: 'http://localhost/jobs/test/doc3.rtf',
                },
                {
                    id: 'doc2.rtf',
                    href: 'http://localhost/jobs/test/doc2.rtf',
                },
                {
                    id: 'doc1.rtf',
                    href: 'http://localhost/jobs/test/doc1.rtf',
                },
            ],
        });
    });

    it('handles errors from s3', async () => {
        const event = {
            bucket: 'test-bucket',
            prefix: 'test-prefix',
            perpage: 10,
            token: 'test-token',
            root: 'http://localhost',
            type: 'test',
        };

        s3ClientMock.on(ListObjectsCommand).rejects('mocked rejection');

        await expect(handler(event, {})).rejects.toEqual(JSON.stringify({
            type: '[InternalServiceError]',
            data: {},
        }));

        expect(s3ClientMock).toHaveReceivedNthCommandWith(1, ListObjectsCommand, {
            Bucket: 'test-bucket',
            Marker: 'test-token',
            Prefix: 'test-prefix',
            MaxKeys: 10,
        });
    });
});
