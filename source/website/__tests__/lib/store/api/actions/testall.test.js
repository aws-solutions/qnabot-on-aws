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

const testallModule = require('../../../../../js/lib/store/api/actions/testall');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');

const s3ClientMock = mockClient(S3Client);

describe('testall action test', () => {
    const testResponse = {
        _links: {
            testall: {
                href: 'test-href',
            },
        },
    };

    const testInfo = {
        _links: {
            testall: {
                href: 'test-href',
            }
        }
    };

    beforeEach(() => {
        jest.resetAllMocks();
        s3ClientMock.reset();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('startTestAll with filter', async () => {
        const opts = {
            filter: 'test-filter',
            token: 'test-token',
            name: 'test-name',
            locale: 'es_US',
        };
        mockedContext.dispatch.mockReturnValueOnce(testInfo);
        await testallModule.startTestAll(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(2);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${testInfo._links.testall.href}/${opts.name}`,
            method: 'put',
            body: {
                filter: `${opts.filter}.*`,
                token: `${opts.token}`,
                locale: 'es_US'
            },
        });
    });

    test('startTestAll without filter', async () => {
        const opts = {
            filter: '',
            token: 'test-token',
            name: 'test-name',
            locale: '',
        };
        mockedContext.dispatch.mockReturnValueOnce(testInfo);
        await testallModule.startTestAll(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(2);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${testInfo._links.testall.href}/${opts.name}`,
            method: 'put',
            body: {
                token: `${opts.token}`,
                locale: 'en_US',
            },
        });
    });

    test('downloadTestAll', async () => {
        const opts = {
            bucket: 'test-bucket',
            key: 'test-key',
        };
        const testResult = 'Some result from S3';
        s3ClientMock.on(GetObjectCommand).resolvesOnce({
            Body: {
                transformToString: () => testResult,
            },
        });
        const downloadTestAll = testallModule.downloadTestAll;
        const result = await downloadTestAll(mockedContext, opts);
        expect(result).toEqual(testResult);
    });

    test('waitForTestAll found the job', async () => {
        const opts = {
            id: 'the-one-you-want',
        };
        const jobs = [
            { id: 'the-one-you-want' },
            { id: 'not-the-one-you-want' },
        ];
        const resFunction = jest.fn().mockImplementation((job) => job);
        const rejFunction = jest.fn();
        mockedContext.dispatch
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs });
        await testallModule.waitForTestAll(mockedContext, opts).then(resFunction, rejFunction);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: testResponse._links.testall.href,
            method: 'get',
        });
        expect(resFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledTimes(0);
    });

    test('waitForTestAll did not find the job', async () => {
        const opts = {
            id: 'id-that-does-not-exist',
        };
        const jobs = [
            { id: 'the-one-you-want' },
            { id: 'not-the-one-you-want' },
        ];
        const resFunction = jest.fn();
        const rejFunction = jest.fn((err) => err);
        mockedContext.dispatch
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs })
            .mockReturnValueOnce(testResponse)
            .mockReturnValueOnce({ jobs });
        await testallModule.waitForTestAll(mockedContext, opts).then(resFunction, rejFunction);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: testResponse._links.testall.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(22);
        expect(resFunction).toHaveBeenCalledTimes(0);
        expect(rejFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledWith('timeout');
    });

    test('waitForTestAll threw an error', async () => {
        const opts = {
            id: 'id-that-does-not-exist',
        };
        const jobs = [
            { id: 'the-one-you-want' },
            { id: 'not-the-one-you-want' },
        ];
        const mockedError = new Error('test-error');
        const resFunction = jest.fn();
        const rejFunction = jest.fn((err) => err);
        mockedContext.dispatch.mockImplementationOnce(() => { throw mockedError; });
        await testallModule.waitForTestAll(mockedContext, opts).then(resFunction, rejFunction);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(resFunction).toHaveBeenCalledTimes(0);
        expect(rejFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledWith(mockedError);
    });

    test('listTestAll', async () => {
        mockedContext.dispatch.mockReturnValueOnce(testResponse);
        await testallModule.listTestAll(mockedContext, {});
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: testResponse._links.testall.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(2);
    });

    test('getTestAll', () => {
        const opts = {
            href: 'test-href',
        };
        testallModule.getTestAll(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: opts.href,
            method: 'get',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
    });

    test('deleteTestAll', () => {
        const opts = {
            href: 'test-href',
        };
        testallModule.deleteTestAll(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: opts.href,
            method: 'delete',
        });
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
    });
});
