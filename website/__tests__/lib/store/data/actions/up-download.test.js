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
const upDownloadModule = require('../../../../../js/lib/store/data/actions/up-download');
const axios = require('axios');
const util = require('../../../../../js/lib/store/data/actions/util');
const { Validator } = require('jsonschema');

jest.mock('axios');
jest.mock('../../../../../js/lib/store/data/actions/util');

describe('up-download data action', () => {
    const mockedContext = {
        dispatch: jest.fn(),
        commit: jest.fn(),
        state: {
            QAs: [
                {
                    questions: [
                        { text: 'question 1' },
                        { text: 'question 2' },
                    ],
                    answer: {
                        text: 'test answer',
                    },
                    card: {
                        text: '{ "key": "value" }',
                    },
                    qid: {
                        text: '1',
                    },
                },
            ],
            selectIds: [
                '1',
                '2',
            ],
        },
    };
    const mockedResult = {
        qa: 'test qna',
    };

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('download success', async () => {
        const expectedBlob = new Blob(
            [JSON.stringify({ qna: mockedResult.qa }, null, 3)],
            { type: 'text/plain;charset=utf-8' },
        );
        util.api.mockResolvedValueOnce(mockedResult);
        await expect(upDownloadModule.download(mockedContext)).resolves.toEqual(expectedBlob);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(
            mockedContext,
            'list',
            { from: 'all' },
        );
    });

    test('download failure', async () => {
        const testError = new Error('Failed to download');
        util.api.mockImplementationOnce(() => {
            throw testError;
        });
        await expect(upDownloadModule.download(mockedContext)).rejects.toEqual(testError);
        expect(util.api).toHaveBeenCalledTimes(1);
    });

    test('downloadSelect failure', async () => {
        const expectedError = new Error('Failed to download the select');
        util.api.mockImplementationOnce(() => {
            throw new Error('test error');
        });
        await expect(upDownloadModule.downloadSelect(mockedContext)).rejects.toEqual(expectedError);
    });

    test('upload with data params', async () => {
        const expectedOut = {};
        const mockedParams = {
            data: 'test-data',
        };
        mockedContext.dispatch.mockResolvedValueOnce(expectedOut);
        await upDownloadModule.upload(mockedContext, mockedParams);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('uploadProcess', { data: mockedParams.data });
    });

    test('upload with url params', async () => {
        const expectedOut = {};
        const mockedParams = {
            url: 'https://example.com',
        };
        mockedContext.dispatch.mockResolvedValueOnce(expectedOut);
        await upDownloadModule.upload(mockedContext, mockedParams);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('uploadUrl', { url: mockedParams.url });
    });

    test('upload with invalid params', async () => {
        const mockedParams = {
            unknownKey: 'someValue',
        };
        const expectedErrorMessage = 'invalid params';
        jest.spyOn(Promise, 'reject');
        await expect(upDownloadModule.upload(mockedContext, mockedParams))
            .rejects.toEqual(expectedErrorMessage);
        expect(Promise.reject).toHaveBeenCalledWith(expectedErrorMessage);
    });

    test('upload throws an error', async () => {
        const mockedParams = {
            data: 'test-data',
        };
        const expectedError = new Error('Failed to upload');
        mockedContext.dispatch.mockImplementationOnce(() => {
            throw new Error('test error');
        });
        await expect(upDownloadModule.upload(mockedContext, mockedParams))
            .rejects.toEqual(expectedError);
    });

    test('uploadProcess has valid qna', async () => {
        jest.spyOn(Validator.prototype, 'validate').mockImplementationOnce(() => ({ valid: true }));
        await upDownloadModule.uploadProcess(mockedContext, { data: 'test value' });
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(
            mockedContext,
            'bulk',
            'test value',
        );
    });

    test('uploadProcess has invalid qna', async () => {
        const validationResult = {
            valid: false,
            errors: [
                { stack: 'testFunction' },
                { stack: 'testFunction2' },
            ],
        };
        const expectedRejectParam = `Invalid QnA:${validationResult.errors.map((err) => err.stack).join(',')}`;
        jest.spyOn(Validator.prototype, 'validate').mockImplementationOnce(() => validationResult);
        jest.spyOn(Promise, 'reject');
        await upDownloadModule.uploadProcess(mockedContext, {});
        expect(util.api).toHaveBeenCalledTimes(0);
        expect(Promise.reject).toHaveBeenCalledWith(expectedRejectParam);
    });

    test('uploadProcess throws an error', async () => {
        jest.spyOn(Validator.prototype, 'validate').mockImplementationOnce(() => {
            throw new Error('test error');
        });
        const expectedError = new Error('Failed in upload process');
        await expect(upDownloadModule.uploadProcess(mockedContext, {})).rejects.toEqual(expectedError);
    });

    test('uploadUrl success', async () => {
        const mockUrl = 'https://test.com'
        const mockedResult = {
            data: 'test data',
        };
        axios.get.mockResolvedValueOnce(mockedResult);
        await upDownloadModule.uploadUrl(mockedContext, { mockUrl });
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('upload', { data: 'test data' });
    });

    test('uploadUrl failure', async () => {
        const expectedError = new Error('Error: please check URL and source CORS configuration');
        axios.get.mockImplementationOnce(() => {
            throw new Error('test error');
        });
        await expect(upDownloadModule.uploadUrl(mockedContext, {})).rejects.toEqual(expectedError);
    });
});
