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

const { sanitize, escapeHashMarkdown } = require('../lib/sanitizeOutput');

describe('should be able to sanitize LLM Outputs', () => {
    it('should sanitize input data correctly', () => {
        const inputData = '<script>alert("XSS attack");</script><img src=x onerror=alert(1)><p>Hello, world!</p>';
        const expectedOutput = '<p>Hello, world!</p>';
        const sanitizedData = sanitize(inputData);
        expect(sanitizedData).toEqual(expectedOutput);
    });

    it('should handle empty input data', () => {
        const inputData = '';
        const sanitizedData = sanitize(inputData);
        expect(sanitizedData).toEqual('');
    });

    it('should allow href', () => {
        const inputData = '<a href="http://somelink.com">Some text</a>';
        const sanitizedData = sanitize(inputData);
        expect(sanitizedData).toEqual('<a href="http://somelink.com">Some text</a>');
    });

    it('should handle normal response', () => {
        const inputData = '<p>Sorry I don\'t know</p>';
        const sanitizedData = sanitize(inputData);
        expect(sanitizedData).toEqual('<p>Sorry I don\'t know</p>');
    });
});

describe('should be able to escape hash sybmbol to prevent markdown issue', () => {
    test('escape hash sybmbol when it appears at the beginning of a line', () => {
        const text1 = '#  https://amazon.com/#  https://docs.aws.amazon.com/#      6. first link is for amazon.   7. second link documentation.';
        const expectedOutput = '\\#  https://amazon.com/#  https://docs.aws.amazon.com/#      6. first link is for amazon.   7. second link documentation.';
        expect(escapeHashMarkdown(text1)).toBe(expectedOutput);
      });
    
    
      test('should escape a # in the first word in the input string starts with multiple hash symbols', () => {
        const text2 = '### three';
        const expectedOutput = '\\### three'; // jest will added extra \ so actual expectedOutput is '\### three'
        expect(escapeHashMarkdown(text2)).toBe(expectedOutput);
      });
    
      test('should not escape hash symbols that appear in the middle of line', () => {
        const text3 = 'In ### between';
        const expectedOutput = 'In ### between';
        expect(escapeHashMarkdown(text3)).toBe(expectedOutput);
      });
  });