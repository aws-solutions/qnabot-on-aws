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
import mockedContext from './mockedContext';

const exportModule = require('../../../../../js/lib/store/api/actions/export');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');

const s3ClientMock = mockClient(S3Client);

describe('export action test', () => {
    const mockedInfo = {
        _links: {
            exports: {
                href: '',
            },
            imports: {
                href: '',
            },
        },
    };

    beforeEach(() => {
        jest.resetAllMocks();
        s3ClientMock.reset();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
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
            bucket: 'test-bucket'
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

    test('waitForExport finds id', async () => {
        const opts = { id: 'test-id' };
        const mockedResults = {
            jobs: [
                { id: 'test-id' },
                { id: 'not-the-test-id-you-want' },
            ],
        };
        const resFunction = jest.fn().mockImplementation((job) => job);
        const rejFunction = jest.fn().mockImplementation((error) => error);

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
        const resFunction = jest.fn().mockImplementation((job) => job);
        const rejFunction = jest.fn().mockImplementation((error) => error);

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
        const resFunction = jest.fn().mockImplementation((job) => job);
        const rejFunction = jest.fn().mockImplementation((error) => error);

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
        const opts = { href: '' };
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
        const opts = { href: '' };
        await exportModule.deleteExport(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: opts.href,
            method: 'delete',
        });
    });
});
