/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */


const index = require('../../lib/index');
const qids = require('../../lib/qidsandquestions');
const lexV2 = require('../../lib/lexv2bot');
const originalEnv = process.env;
jest.mock('../../lib/qidsandquestions');
jest.mock('../../lib/lexv2bot');

describe('When running index function', () => {
        beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Should execute only lexV2', async () => {

        process.env = {
            ...originalEnv,
        };

        const params = {name: 'test-index'};

        const sampleQid = {
            q: 'What is QnABot'
        };
        qids.mockImplementation(() => {
            return sampleQid;
        });
        await index(params);

        expect(qids).toBeCalledTimes(1);
        expect(qids).toBeCalledWith(params);
        expect(lexV2).toBeCalledTimes(1);
        expect(lexV2).toBeCalledWith(sampleQid);
    });

});
