/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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