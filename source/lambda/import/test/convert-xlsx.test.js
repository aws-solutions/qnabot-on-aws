 /** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const convertxlsx = require('../convert-xlsx');
const excelFile = './test/import-test.xlsx';
const qnabot = require('qnabot/logging');

const obj1 = {
    qid: 'Import.002',
    clientFilterValues: 'Test',
    attributename1: 'TestName',
    attributevalue1: 'TestValue',
    enabletranslation1: false,
    attributename2: 'TestName2',
    attributevalue2: 'TestValue2',
    enabletranslation2: true,
    q: [
      'How do I import questions in content designer?',
      'How do I import questions using QnA Bot?'
    ],
    t: 'import',
    alt: {
      markdown: '*From the import page.*',
      ssml: '<speak>From the import page.</speak>'
    },
    a: 'From the import page.',
    r: {
      title: 'Alexa',
      imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/61bze1WJhfL._AC_SL1024_.jpg',
      buttons: [
        { text: 'Tell me about the Alexa Show.', value: 'The Echo Show' },
        { text: 'Tell me about the Echo Dot', value: 'The Echo Dot' }
      ]
    },
    elicitResponse: { responsebot_hook: 'QnAYesNoBot' }
  };

const obj2 = {
    qid: 'Import.003',
    cardtitle: null,
    cardsubtitle: null,
    imageurl: null,
    displaytext1: null,
    buttonvalue1: null,
    displaytext2: null,
    buttonvalue2: null,
    clientFilterValues: null,
    attributename1: null,
    attributevalue1: null,
    enabletranslation1: null,
    attributename2: null,
    attributevalue2: null,
    enabletranslation2: null,
    q: [
      'Can I import multiple answers when I import with excel?',
      'Can I import multiple answers when I import with excel using QnA Bot?'
    ],
    t: null,
    alt: { markdown: null, ssml: null },
    a: 'Of course!'
  };

describe('when calling convertxlsx function', () => {
    beforeEach(() => {
        qnabot.log = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should read excel file and return an objects', async() => {
        const questionArray = await convertxlsx.convertxlsx(excelFile);
        expect(questionArray).toBeInstanceOf(Array);
        expect(questionArray.length).toEqual(8);
        expect(questionArray[0]).toEqual(obj1);
        expect(questionArray[1]).toEqual(obj2);
        expect(qnabot.log).toHaveBeenCalledWith('Warning: No QID found for line 4. The question will be skipped.');
        expect(qnabot.log).toHaveBeenCalledWith('Warning: No questions found for QID: Import.005. The question will be skipped.');
        expect(qnabot.log).toHaveBeenCalledWith('Warning: No answer found for QID: Import.006. The question will be skipped.');
        expect(qnabot.log).toHaveBeenCalledWith('Warning: buttonvalue1 must be less than or equal to 80 characters for qid: Import.007');
        expect(qnabot.log).toHaveBeenCalledWith('Warning:  Both displaytext1 and buttonvalue1 must be defined for qid: Import.008');
        expect(qnabot.log).toHaveBeenCalledWith('Warning: displaytext1 must be less than or equal to 80 characters for qid: Import.009');
        expect(qnabot.log).toHaveBeenCalledWith('Warning: QID found for line 13 must have no spaces. The question will be skipped.')
    });

    it('should not read json file and log error', async() => {
        const invalidContent = '{}'
        await expect(convertxlsx.convertxlsx(invalidContent)).rejects.toThrow();
        expect(qnabot.log).toHaveBeenCalledWith('Parse error');
    });
});