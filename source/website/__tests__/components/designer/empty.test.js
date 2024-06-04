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
