/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { vi, beforeEach, describe, test, expect } from 'vitest';
import mockedContext from './mockedContext';

import exportModule from '../../../../../js/lib/store/api/actions/export';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const s3ClientMock = mockClient(S3Client);
const dynamoDBClientMock = mockClient(DynamoDBClient);

describe('export action test', () => {
    const mockedInfo = {
        _links: {
            exports: {
                href: 'https://example.com/exports',
            },
            imports: {
                href: 'https://example.com/imports',
            },
            jobs: {
                href: 'https://example.com/jobs',
            },
        },
    };

    beforeEach(() => {
        vi.resetAllMocks();
        s3ClientMock.reset();
        dynamoDBClientMock.reset();
        vi.spyOn(console, 'log').mockImplementation(vi.fn());
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
    });

    test('startExport with filter and encryption', async () => {
        const opts = {
            name: 'test-export',
            filter: 'test-filter',
        };

        const mockSettings = [
            {}, // default_settings
            {}, // custom_settings
            { S3_PUT_REQUEST_ENCRYPTION: 'AES256' } // merged_settings
        ];

        dynamoDBClientMock.on(ScanCommand).resolves({
            Items: [
                {
                    SettingName: { S: 'S3_PUT_REQUEST_ENCRYPTION' },
                    SettingValue: { S: 'AES256' },
                    DefaultValue: { S: '' },
                    SettingCategory: { S: 'Custom' }
                }
            ]
        });

        mockedContext.dispatch.mockReturnValueOnce(mockedInfo);
        mockedContext.dispatch.mockReturnValueOnce({});

        await exportModule.startExport(mockedContext, opts);

        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', expect.objectContaining({
            url: `${mockedInfo._links.exports.href}/${opts.name}`,
            method: 'put',
            body: { filter: `${opts.filter}.*`, prefix: '' }
        }));
    });

    test('startExport without filter', async () => {
        const opts = {
            name: 'test-export',
        };

        dynamoDBClientMock.on(ScanCommand).resolves({
            Items: []
        });

        mockedContext.dispatch.mockReturnValueOnce(mockedInfo);
        mockedContext.dispatch.mockReturnValueOnce({});

        await exportModule.startExport(mockedContext, opts);

        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', expect.objectContaining({
            url: `${mockedInfo._links.exports.href}/${opts.name}`,
            method: 'put',
            body: { prefix: '' }
        }));
    });

    test('startKendraSyncExport with filter', async () => {
        const opts = {
            name: 'test-name',
            filter: 'filter',
        };
        mockedContext.dispatch.mockReturnValueOnce(mockedInfo);
        await exportModule.startKendraSyncExport(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(2);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedInfo._links.exports.href}/${opts.name}`,
            method: 'put',
            body: {
                filter: `${opts.filter}.*`,
                prefix: 'kendra-',
            },
        });
    });

    test('startKendraSyncExport without filter', async () => {
        const opts = {
            name: 'test-name',
        };
        mockedContext.dispatch.mockReturnValueOnce(mockedInfo);
        await exportModule.startKendraSyncExport(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(2);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedInfo._links.exports.href}/${opts.name}`,
            method: 'put',
            body: {
                prefix: 'kendra-',
            },
        });
    });

    test('downloadExport', async () => {
        const opts = {
            bucket: 'test-bucket',
            key: 'test-key'
        };
        const bodyString = 'test';
        const expectedResult = `{"qna":[${bodyString}]}`;

        s3ClientMock.on(GetObjectCommand).resolvesOnce({
            Body: {
                transformToString: () => bodyString
            },
        });
        const downloadExport = exportModule.downloadExport;
        const result = await downloadExport(mockedContext, opts);
        expect(result).toEqual(expectedResult);
    });

    test('downloadExport with newlines', async () => {
        const opts = {
            bucket: 'test-bucket',
            key: 'test-key'
        };
        const bodyString = 'line1\nline2\nline3';
        const expectedResult = `{"qna":[${bodyString.replace(/\n/g, ',\n')}]}`;

        s3ClientMock.on(GetObjectCommand).resolvesOnce({
            Body: {
                transformToString: () => bodyString
            },
        });
        const result = await exportModule.downloadExport(mockedContext, opts);
        expect(result).toEqual(expectedResult);
    });

    test('waitForExport finds id', async () => {
        const opts = { id: 'test-id' };
        const mockedResults = {
            jobs: [
                { id: 'test-id' },
                { id: 'not-the-test-id-you-want' },
            ],
        };
        const resFunction = vi.fn().mockImplementation((job) => job);
        const rejFunction = vi.fn().mockImplementation((error) => error);

        // Mock the returned values from the dispatch method call in chronological order.
        mockedContext.dispatch
            .mockReturnValueOnce(mockedInfo)
            .mockReturnValueOnce(mockedResults);

        await exportModule.waitForExport(mockedContext, opts).then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledTimes(0);
    });

    test('waitForExport does not find id', async () => {
        const opts = { id: 'not-a-test-id' };
        const mockedResults = {
            jobs: [
                { id: 'test-id' },
                { id: 'not-the-test-id-you-want' },
            ],
        };
        const resFunction = vi.fn().mockImplementation((job) => job);
        const rejFunction = vi.fn().mockImplementation((error) => error);

        // Mock the returned values from the dispatch method call in chronological order.
        mockedContext.dispatch
            .mockReturnValueOnce(mockedInfo)
            .mockReturnValueOnce(mockedResults);

        await exportModule.waitForExport(mockedContext, opts).then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(0);
        expect(rejFunction).toHaveBeenCalledTimes(1);
    });

    test('waitForExport throws an error', async () => {
        const opts = {};
        const resFunction = vi.fn().mockImplementation((job) => job);
        const rejFunction = vi.fn().mockImplementation((error) => error);

        // Force the dispatch method to throw an error.
        mockedContext.dispatch.mockImplementationOnce(() => {
            throw new Error('test error -- a valid error');
        });

        await exportModule.waitForExport(mockedContext, opts).then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(0);
        expect(rejFunction).toHaveBeenCalledTimes(1);
    });

    test('listExports', async () => {
        const opts = {};
        const listOfExports = 'list of exports';
        mockedContext.dispatch
            .mockReturnValueOnce(mockedInfo)
            .mockReturnValueOnce(listOfExports);
        const result = await exportModule.listExports(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(2);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedInfo._links.exports.href,
            method: 'get',
        });
        expect(result).toEqual(listOfExports);
    });

    test('getExport', async () => {
        const opts = { href: 'https://example.com/export/123' };
        await exportModule.getExport(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: opts.href,
            method: 'get',
        });
    });

    test('getExportByJobId', async () => {
        const id = 'test-id';
        await exportModule.getExportByJobId(mockedContext, id);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedContext.rootState.info._links.jobs.href}/exports/${id}`,
            method: 'get',
        });
    });

    test('deleteExport', async () => {
        const opts = { href: 'https://example.com/export/123' };
        await exportModule.deleteExport(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: opts.href,
            method: 'delete',
        });
    });
});
