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
const osWarmer = require('../index');
const warmer = new (require('../lib'))();

jest.mock('../lib');

describe('when calling lambda handler function', () => {
    test('processing throws error and action is END', async () => {
        warmer.perform.mockReturnValue(('success'));
        expect(await osWarmer.warmer({}, null, null)).toEqual("complete");
    });
});