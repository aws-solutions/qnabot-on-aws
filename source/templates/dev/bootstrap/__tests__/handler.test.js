/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

require("aws-sdk-client-mock-jest");
const { EventEmitter } = require('events');
const httpsMock = require('https');
const Stream = require('stream');
const { S3Client, DeleteObjectsCommand, ListObjectVersionsCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const s3ClientMock = mockClient(S3Client);
const { handler } = require('../handler');
const { event, endMock, writeMock, doneMock } = require('./handler.fixtures');

jest.mock('https', () => ({
    methodToMock: {},
}));

const context = {
    logStreamName: 'mock log stream name',
    done: doneMock,
};

const emitter = new EventEmitter();
emitter.write = writeMock;
emitter.end = endMock;

describe('bootstrap handler', () => {
    beforeEach(() => {
        jest.resetModules();
        endMock.mockRestore();
        doneMock.mockRestore();
        writeMock.mockRestore();
        s3ClientMock.reset();
    });

    it('should send a put request to the provided url', async () => {
        const message = new Stream();

        httpsMock.request = jest.fn().mockImplementation((options, cb) => {
            cb(message);

            expect(options.hostname).toEqual('localhost');
            expect(options.method).toEqual('PUT');
            expect(options.port).toEqual(443);
            message.emit('end');
            return emitter;
        });

        await handler(event, context);
        expect(writeMock).toHaveBeenCalled();
        expect(endMock).toHaveBeenCalled();
        expect(doneMock).toHaveBeenCalled();
    });

    it('should close context on error', async () => {
        const message = new Stream();

        httpsMock.request = jest.fn().mockImplementation((options, cb) => {
            cb(message);

            expect(options.hostname).toEqual('localhost');
            expect(options.method).toEqual('PUT');
            expect(options.port).toEqual(443);
            message.emit('end');
            return emitter;
        });

        await handler(event, context);
        emitter.emit('error', 'error message');
        expect(writeMock).toHaveBeenCalled();
        expect(endMock).toHaveBeenCalled();
        expect(doneMock).toHaveBeenCalled();
    });

    it('should delete objects from the bucket', async () => {
        const message = new Stream();
        const clonedEvent = JSON.parse(JSON.stringify(event));
        clonedEvent.RequestType = 'Delete';

        s3ClientMock.on(ListObjectVersionsCommand)
            .resolvesOnce({
                Versions: [
                    {
                        Key: 'test',
                        VersionId: 'test',
                        DeleteMarker: false,
                        LastModified: 'test',
                    },
                ],
                DeleteMarkers: [
                    {
                        Key: 'test2',
                        VersionId: 'test',
                        DeleteMarker: true,
                        LastModified: 'test',
                    },
                ],
            })
            .resolvesOnce({});

        httpsMock.request = jest.fn().mockImplementation((options, cb) => {
            cb(message);

            expect(options.hostname).toEqual('localhost');
            expect(options.method).toEqual('PUT');
            expect(options.port).toEqual(443);
            message.emit('end');
            return emitter;
        });

        await handler(clonedEvent, context);
        emitter.emit('end', 'end');
        expect(s3ClientMock).toHaveReceivedCommandWith(ListObjectVersionsCommand, { Bucket: "test-bucket" });
        expect(s3ClientMock).toHaveReceivedCommandWith(DeleteObjectsCommand, {
            Bucket: "test-bucket",
            Delete: {
                Objects: [
                    {
                        Key: 'test',
                        VersionId: 'test',
                    },
                    {
                        Key: 'test2',
                        VersionId: 'test',
                    },
                ],
            },
        });
        expect(writeMock).toHaveBeenCalled();
        expect(endMock).toHaveBeenCalled();
        expect(doneMock).toHaveBeenCalled();
    });

    it('should handle s3 client errors gracefully', async () => {
        const message = new Stream();
        const clonedEvent = JSON.parse(JSON.stringify(event));
        clonedEvent.RequestType = 'Delete';

        s3ClientMock.rejects('mocked rejection');

        httpsMock.request = jest.fn().mockImplementation((options, cb) => {
            cb(message);

            expect(options.hostname).toEqual('localhost');
            expect(options.method).toEqual('PUT');
            expect(options.port).toEqual(443);
            message.emit('end');
            return emitter;
        });

        await handler(clonedEvent, context);
        emitter.emit('end', 'end');
        expect(s3ClientMock).toHaveReceivedCommandWith(ListObjectVersionsCommand, { Bucket: "test-bucket" });
        expect(writeMock).toHaveBeenCalled();
        expect(endMock).toHaveBeenCalled();
        expect(doneMock).toHaveBeenCalled();
    });
});
