/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const fs = require('fs');
const { handler } = require('../parseJSON');

describe('Test parseJSON', () => {
    const content = '{"a":"resetLang","type":"qna","qid":"001", "q":["Reset"]}'
    const testParams = {
        input_path: './test/test.json',
        output_path: './test/test.json',
        content : content
    };
    beforeEach(() => {
        jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        console.log = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should parse a QNA JSON file', async () => {
        await handler(testParams);
        const expectedData = {
            SchemaVersion : 1,
            FaqDocuments: [{
                Question: 'Reset',
                Answer: 'resetLang',
                Attributes: {
                    
                    "_source_uri":'{"_source_qid":"001"}'
                }
            }]
        };
        expect(fs.writeFileSync).toHaveBeenCalledWith(testParams.output_path, JSON.stringify(expectedData), { encoding: 'utf8' } );
        
    });

    it('should skip elem conditions when enableQidContent set to true', async () => {
        const content = '{"a":"resetLang","type":"qna","qid":"001", "q":["Reset"], "enableQidIntent":"true"}'
        const testParams = {
            input_path: './test/test.json',
            output_path: './test/test.json',
            content: content,
    
        };
        await handler(testParams);
        const expectedData = {
            SchemaVersion : 1,
            FaqDocuments: []
        };
        expect(fs.writeFileSync).toHaveBeenCalledWith(testParams.output_path, JSON.stringify(expectedData), { encoding: 'utf8' } );
        
    });

    it('should log correct response when elem.q condition is not met', async () => {
        const content = '{}'
        const testParams = {
            input_path: './test/test.json',
            output_path: './test/test.json',
            content: content,
    
        };
        await handler(testParams);
        expect(console.log).toHaveBeenCalledWith('this element is not supported with KendraFAQ and was skipped in the sync: {}');
        
    });
})