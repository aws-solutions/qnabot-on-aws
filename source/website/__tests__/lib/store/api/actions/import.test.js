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

const importModule = require('../../../../../js/lib/store/api/actions/import');
const { S3Client } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');

const s3ClientMock = mockClient(S3Client);

describe('import action test', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        s3ClientMock.reset();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('listExamples', async () => {
        const mockedResponse = {
            examples: [
                {
                    id: 'example-1',
                    description: {},
                },
                {
                    id: 'example-2',
                    description: {},
                },
            ],
        };

        mockedContext.dispatch.mockReturnValueOnce(mockedResponse);
        await importModule.listExamples(mockedContext);
        expect(mockedContext.dispatch).toBeCalledTimes(1);
    });

    test('listExamples with href to dispatch', async () => {
        const mockedResponse = {
            examples: [
                {
                    id: 'example-1',
                    description: {
                        href: 'https://example.com',
                    },
                },
                {
                    id: 'example-2',
                    description: {
                        href: 'https://example2.com',
                    },
                },
            ],
        };

        mockedContext.dispatch.mockReturnValueOnce(mockedResponse);
        await importModule.listExamples(mockedContext);
        expect(mockedContext.dispatch).toBeCalledTimes(1 + mockedResponse.examples.length);
    });

    test('getExampleDescription', async () => {
        const mockedExample = {
            description: {
                href: 'https://example.com',
            },
        };

        await importModule.getExampleDescription(mockedContext, mockedExample);
        expect(mockedContext.dispatch).toBeCalledWith('_request', {
            url: mockedExample.description.href,
            method: 'get',
        });
    });

    test('startImport', async () => {
        const mockedOpts = {
            name: 'test-name',
            qa: [
                'item1',
                'item2',
            ],
        };
        const mockedResponse = {
            _links: {
                imports: {
                    bucket: 'test-bucket',
                    uploadPrefix: 'test-prefix',
                },
            },
        };

        mockedContext.dispatch.mockReturnValueOnce(mockedResponse);

        s3ClientMock.send.returns('success');
        const result = await importModule.startImport(mockedContext, mockedOpts);
        expect(result).toEqual('success');
    });

    test('waitForImport with job found', async () => {
        const mockedResponse = {
            _links: {
                imports: {
                    href: '',
                },
            },
        };
        const mockedResults = {
            jobs: [
                { id: 'test-id' },
                { id: 'not-the-test-id-you-want' },
            ],
        };
        const opts = {
            id: 'test-id',
        };
        const resFunction = jest.fn().mockImplementation((job) => job);
        const rejFunction = jest.fn().mockImplementation((error) => error);

        mockedContext.dispatch
            .mockReturnValueOnce(mockedResponse)
            .mockReturnValueOnce(mockedResults);

        await importModule.waitForImport(mockedContext, opts).then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledTimes(0);
    });

    test('waitForImport with job not found', async () => {
        const mockedResponse = {
            _links: {
                imports: {
                    href: '',
                },
            },
        };
        const mockedResults = {
            jobs: [
                { id: 'test-id' },
                { id: 'not-the-test-id-you-want' },
            ],
        };
        const opts = {
            id: 'test-id-not-in-the-job-list',
        };
        const resFunction = jest.fn().mockImplementation((job) => job);
        const rejFunction = jest.fn().mockImplementation((error) => error);

        mockedContext.dispatch
            .mockReturnValueOnce(mockedResponse)
            .mockReturnValueOnce(mockedResults);

        await importModule.waitForImport(mockedContext, opts).then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(0);
        expect(rejFunction).toHaveBeenCalledTimes(1);
    });

    test('waitForImport with error thrown', async () => {
        const mockedResponse = {
            _links: {
                imports: {
                    href: '',
                },
            },
        };
        const mockedResults = {
            jobs: [
                { id: 'test-id' },
                { id: 'not-the-test-id-you-want' },
            ],
        };
        const opts = {
            id: 'test-id-not-in-the-job-list',
        };
        const resFunction = jest.fn().mockImplementation((job) => job);
        const rejFunction = jest.fn().mockImplementation((error) => error);
        const mockedError = new Error('test error -- a valid error');

        mockedContext.dispatch.mockImplementationOnce(() => {
            throw mockedError;
        });

        await importModule.waitForImport(mockedContext, opts).then(resFunction, rejFunction);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.jobs.href,
            method: 'get',
        });
        expect(resFunction).toHaveBeenCalledTimes(0);
        expect(rejFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toBeCalledWith(mockedError);
    });

    test('listImports', async () => {
        const mockedResponse = {
            _links: {
                imports: {
                    href: '',
                },
            },
        };
        mockedContext.dispatch.mockReturnValueOnce(mockedResponse);
        await importModule.listImports(mockedContext, {});
        expect(mockedContext.dispatch).toBeCalledTimes(2);
    });

    test('getImport', () => {
        const opts = {
            href: '',
        };
        importModule.getImport(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: opts.href,
            method: 'get',
        });
    });

    test('deleteImport', () => {
        const opts = {
            href: '',
        };
        importModule.deleteImport(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: opts.href,
            method: 'delete',
        });
    });

    test('getTerminologies', () => {
        const opts = {
            href: '',
        };
        importModule.getTerminologies(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedContext.rootState.info._links.translate.href}/list`,
            method: 'post',
        });
    });

    test('startImportTranslate', () => {
        const opts = {
            name: '',
            description: '',
            file: '',
        };

        importModule.startImportTranslate(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedContext.rootState.info._links.translate.href}/import`,
            method: 'post',
            body:
            {
                name: opts.name,
                description: opts.description,
                file: opts.file,
            },
        });
    });
});
