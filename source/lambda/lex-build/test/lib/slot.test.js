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


const slot = require('../../lib/slot');
const run = require('../../lib/run');
jest.mock('../../lib/run');

describe('When running slot function', () => {
    test('Should return slotTypeVersion', async () => {
        const runMock = {
            'name': 'mock-test',
            'checksum': 'checksum-test',
            'version': '3.0'
        };
        run.mockResolvedValue(runMock);

        const utterances = [2, 2, 1];
        const slottype = {
            'name': 'test-slot',
            'status': 'Failed',
            'failureReason': 'timeout',
            'lastUpdatedDate': '12/03/2023',
            'createdDate': '10/27/2023',
            'version': '2.0',
            'enumerationValues': [],
        };

        const responseVersion = await slot(utterances, slottype);

        expect(run).toBeCalledTimes(2);
        expect(run).toBeCalledWith('putSlotType', {"name": "test-slot", "enumerationValues": [{"value": 2}, {"value": 1}], "failureReason": "timeout", "status": "Failed"});
        expect(run).toBeCalledWith('createSlotTypeVersion', {"checksum": "checksum-test", "name": "test-slot"});

        //Deleted Fields set to UnDefined
        expect(slottype.lastUpdatedDate).toBeUndefined();
        expect(slottype.version).toBeUndefined();
        expect(slottype.createdDate).toBeUndefined();

        //Verify slottype.enumerationValues contains distinct values
        const valueArr = [
            {'value': 2},
            {'value': 1}
        ];
        expect(slottype.enumerationValues).toEqual(valueArr);

        //final version is set to mock-run's version
        expect(responseVersion).toEqual('3.0');
    });
});
