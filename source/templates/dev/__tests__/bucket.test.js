/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
