/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { vi } from 'vitest';
import upDownloadModule from '../../../../../js/lib/store/data/actions/up-download';
import axios from 'axios';
import util from '../../../../../js/lib/store/data/actions/util';
import { Validator } from 'jsonschema';

vi.mock('axios');
vi.mock('../../../../../js/lib/store/data/actions/util');

describe('up-download data action', () => {
    const mockedContext = {
        dispatch: vi.fn(),
        commit: vi.fn(),
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
        vi.resetAllMocks();
        vi.spyOn(console, 'log').mockImplementation(vi.fn());
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
        vi.spyOn(Promise, 'reject');
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
        vi.spyOn(Validator.prototype, 'validate').mockImplementationOnce(() => ({ valid: true }));
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
        vi.spyOn(Validator.prototype, 'validate').mockImplementationOnce(() => validationResult);
        await expect(upDownloadModule.uploadProcess(mockedContext, {})).rejects.toThrow('Failed in upload process');
        expect(util.api).toHaveBeenCalledTimes(0);
    });

    test('uploadProcess throws an error', async () => {
        vi.spyOn(Validator.prototype, 'validate').mockImplementationOnce(() => {
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
