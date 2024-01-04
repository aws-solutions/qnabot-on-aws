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


const intentFallback = require('../../lib/intentFallback');
const run = require('../../lib/run');
jest.mock('../../lib/run');

describe('When calling intentFallback function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Should return intentFallback version', async () => {
        const runMock = {
            'name': 'mock-test',
            'checksum': 'checksum-test',
            'version': '3.0'
        };
        run.mockResolvedValue(runMock);

        const version = '2.0';
        const result = {
            'name': 'test',
            'status': 'Failed',
            'failureReason': 'timeout',
            'lastUpdatedDate': '12/03/2023',
            'createdDate': '10/27/2023',
            'version': '2.0'
        };

        const res = await intentFallback(version, result);

        expect(run).toBeCalledTimes(2);
        expect(run).toBeCalledWith('putIntent', {"failureReason": "timeout", "name": "test", "status": "Failed"});
        expect(run).toBeCalledWith('createIntentVersion', {"checksum": "checksum-test", "name": "test"});

        //Deleted Fields set to UnDefined
        expect(result.lastUpdatedDate).toBeUndefined();
        expect(result.version).toBeUndefined();
        expect(result.createdDate).toBeUndefined();

        //IntentVersion set to original version passed in func
        expect(res.intent_version).toEqual('2.0');

        //IntentFallback version set to RunMock version
        expect(res.intentFallback_version).toEqual('3.0');
    });

});
