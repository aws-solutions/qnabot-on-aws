/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const empty = require('../../../js/components/designer/empty');

describe('designer empty helper function', () => {
    test('empty', () => {
        const testString = {
            type: 'string',
            value: 'some-value',
        };
        const emptyString = empty(testString);
        expect(emptyString).toBe('');

        const testBoolean = {
            type: 'boolean',
            value: true,
        };
        const emptyBoolean = empty(testBoolean);
        expect(emptyBoolean).toBe(false);

        const testArray = {
            type: 'array',
            items: ['1'],
        }
        const emptyArray = empty(testArray);
        expect(emptyArray).toEqual([]);

        const testObject = {
            type: 'object',
            key: 'value',
        };
        const emptyObject = empty(testObject);
        expect(emptyObject).toEqual({});
    });
});
