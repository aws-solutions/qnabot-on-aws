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


const intent = require('../../lib/intent');
const run = require('../../lib/run');
const intentFixtures = require('./intent.fixtures');
jest.mock('../../lib/run');

describe('When running intent function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Should return intentVersion when slot name is slot', async () => {
        const runMock = {
            'name': 'mock-test',
            'checksum': 'checksum-test',
            'version': '3.0'
        };
        run.mockResolvedValue(runMock);

        const version = '2.0';
        const result = intentFixtures.returnResult(true);
        const intentVersion = await intent(version, result);

        expect(run).toBeCalledTimes(2);
        expect(run).toBeCalledWith('putIntent', {"failureReason": "timeout", "name": "test-index", "slots": [{"name": "slot", "slotTypeVersion": "2.0"}, {"name": "notSlot", "slotTypeVersion": "1.0"}], "status": "Failed"});
        expect(run).toBeCalledWith('createIntentVersion', {"name": 'test-index', "checksum": 'checksum-test' });
        //Deleted Fields set to UnDefined
        expect(result.lastUpdatedDate).toBeUndefined();
        expect(result.version).toBeUndefined();
        expect(result.createdDate).toBeUndefined();

        //Modify the version in slot[0] with name 'slot'
        expect(result.slots[0].slotTypeVersion).toEqual('2.0');
        //Other slot version remains unchanged
        expect(result.slots[1].slotTypeVersion).toEqual('1.0');

        //intentVersion is equal to the version returned by run mock
        expect(intentVersion).toEqual('3.0');
    });

    test('Should return intentVersion when slot name is notSlot', async () => {
        const runMock = {
            'name': 'mock-test',
            'checksum': 'checksum-test',
            'version': '3.0'
        };
        run.mockResolvedValue(runMock);

        const version = '2.0';
        const result = intentFixtures.returnResult(false);
        const intentVersion = await intent(version, result);

        expect(run).toBeCalledTimes(2);
        expect(run).toBeCalledWith('putIntent', {"failureReason": "timeout", "name": "test-index", "slots": [{"name": "notSlot", "slotTypeVersion": "1.0"}, {"name": "notSlot", "slotTypeVersion": "1.0"}], "status": "Failed"});
        expect(run).toBeCalledWith('createIntentVersion', {"name": 'test-index', "checksum": 'checksum-test' });
        //Deleted Fields set to UnDefined
        expect(result.lastUpdatedDate).toBeUndefined();
        expect(result.version).toBeUndefined();
        expect(result.createdDate).toBeUndefined();

        //Both slots remains unchanged
        expect(result.slots[0].slotTypeVersion).toEqual('1.0');
        expect(result.slots[1].slotTypeVersion).toEqual('1.0');

        //intentVersion is equal to the version returned by run mock
        expect(intentVersion).toEqual('3.0');
    });
});
