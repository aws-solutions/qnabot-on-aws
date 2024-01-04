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


const index = require('../../lib/index');
const utterances = require('../../lib/utterances');
const qids = require('../../lib/qidsandquestions');
const lexV1 = require('../../lib/lexv1bot');
const lexV2 = require('../../lib/lexv2bot');
const originalEnv = process.env;
jest.mock('../../lib/utterances');
jest.mock('../../lib/qidsandquestions');
jest.mock('../../lib/lexv1bot');
jest.mock('../../lib/lexv2bot');

describe('When running index function', () => {
        beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Should execute lexV1 and lexV2 when STATUS_KEY is true', async () => {

        process.env = {
            ...originalEnv,
            STATUS_KEY: 'test-key'
        };

        const params = {name: 'test-index'};
        const sampleUtterance = {
            qid: '1',
            type: 'qna'
        };
        const sampleQid = {
            q: 'What is QnABot'
        };
        utterances.mockImplementation(() => {
            return sampleUtterance;
        });
        qids.mockImplementation(() => {
            return sampleQid;
        });

        await index(params);

        expect(utterances).toBeCalledTimes(1);
        expect(utterances).toBeCalledWith(params);
        expect(qids).toBeCalledTimes(1);
        expect(qids).toBeCalledWith(params);
        expect(lexV1).toBeCalledTimes(1);
        expect(lexV1).toBeCalledWith(sampleUtterance);
        expect(lexV2).toBeCalledTimes(1);
        expect(lexV2).toBeCalledWith(sampleQid);
    });

    test('Should execute only lexV2 when STATUS_KEY is undefined', async () => {

        process.env = {
            ...originalEnv,
            STATUS_KEY: undefined
        };

        const params = {name: 'test-index'};

        const sampleQid = {
            q: 'What is QnABot'
        };
        qids.mockImplementation(() => {
            return sampleQid;
        });
        await index(params);

        expect(utterances).toBeCalledTimes(0);
        expect(qids).toBeCalledTimes(1);
        expect(qids).toBeCalledWith(params);
        expect(lexV1).toBeCalledTimes(0);
        expect(lexV2).toBeCalledTimes(1);
        expect(lexV2).toBeCalledWith(sampleQid);
    });

});
