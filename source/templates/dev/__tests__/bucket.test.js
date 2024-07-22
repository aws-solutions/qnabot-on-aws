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

const mockConfigFull = require('./mockConfigFull.json');
const mockMaster = require('./mockMaster');

function create(filename) {
    const file = `../${filename}`;
    return require(file);
}

describe('dev templates', () => {
    beforeEach(() => {
        jest.mock('../../../bin/exports', () => jest.fn(() => Promise.resolve({
            output: {
                Bucket: 'bucket',
                Prefix: 'prefix',
                devEmail: 'email',
            },
        })));
        jest.mock('../../master', () => mockMaster);
        jest.mock('../../../config.json', () => mockConfigFull);
    });

    it('renders bucket template correctly', async () => {
        const templateFile = await create('bucket');
        expect(templateFile).toMatchSnapshot({});
    });

    afterEach(() => {
        jest.resetModules();
    });
});
