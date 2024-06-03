/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const mockConfig = require('./mockConfig.json');
const mockMaster = require('./mockMaster');
const expectedResult = require('./expectedResult');

function create(filename) {
    const file = `../${filename}`;
    return require(file);
}

describe('public template with config', () => {
    beforeEach(() => {
        jest.mock('../../master', () => mockMaster);
        jest.mock('../../../config.json', () => mockConfig);
    });

    it('uses default params if config file is not set', async () => {
        const templateFile = await create('index.js');
        expect(templateFile).toEqual(expectedResult);
    });

    afterEach(() => {
        jest.resetModules();
    });
});
