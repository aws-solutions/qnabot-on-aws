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
