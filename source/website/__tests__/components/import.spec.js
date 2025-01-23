/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import importModule from '../../js/components/import.vue';
import { shallowMount } from '@vue/test-utils';

describe('import component', () => {
    let store;
    let wrapper;
    let consoleLogSpy;

    const shallowMountWithDefaultStore = () => {
        store.dispatch.mockImplementation(() => Promise.resolve({}));
        wrapper = shallowMount(importModule, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
    };

    beforeEach(() => {
        jest.resetAllMocks();
        consoleLogSpy = jest.spyOn(console, "log")
        consoleLogSpy.mockImplementation(jest.fn());
        store = {
            dispatch: jest.fn(),
        };
    });

    test('created and refresh', async () => {
        shallowMountWithDefaultStore();

        expect(store.dispatch).toHaveBeenCalledTimes(2);
        expect(store.dispatch).toHaveBeenCalledWith('api/listImports');
        expect(store.dispatch).toHaveBeenCalledWith('api/listExamples');
    });

    test('delete', () => {
        shallowMountWithDefaultStore();

        const jobIndexToRemove = 0;
        const job = { 
            loading: false,
            id: 'job1',
        };

        wrapper.vm.$data.jobs = [job];
        wrapper.vm.deleteJob(jobIndexToRemove);
        expect(store.dispatch).toHaveBeenCalledWith('api/deleteImport', job);
    });

    test('close', () => {
        shallowMountWithDefaultStore();

        wrapper.vm.$data.loading = true;
        wrapper.vm.$data.error = true;
        wrapper.vm.$data.errorMsg = 'test error message';
        wrapper.vm.close();
        expect(wrapper.vm.$data.loading).toBe(false);
        expect(wrapper.vm.$data.error).toBe(false);
        expect(wrapper.vm.$data.errorMsg).toEqual('');
    });

    test('importExample, Geturl, upload', () => {
        const mockedData = {
            qna: [{}]
        };
        store.dispatch
            .mockImplementationOnce(() => Promise.resolve({})) // refresh
            .mockImplementationOnce(() => Promise.resolve({})) // created
            .mockImplementationOnce(() => Promise.resolve(mockedData)) // Geturl
            .mockImplementationOnce(() => Promise.resolve({})); // upload
        wrapper = shallowMount(importModule, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        wrapper.vm.importExample('https://example.com/example.txt');
        expect(store.dispatch).toHaveBeenCalledWith('api/getImport', { href: 'https://example.com/example.txt' });
    });

    test('addError', () => {
        shallowMountWithDefaultStore();

        const error = 'error';
        wrapper.vm.addError(error);
        expect(wrapper.vm.$data.errorList.length).toEqual(1);
        expect(wrapper.vm.$data.errorList[0]).toEqual(error);
    });

    test('validateRequiredFields', () => {
        shallowMountWithDefaultStore();

        const question = {
            question1: '1st question'
        };
        const arrayMapping = [
            { required: true, xlsFieldname: 'question' }, 
        ];
        const keepProcessing = true;
        const index = 1;
        const result = wrapper.vm.validateRequiredFields(wrapper.vm, question, arrayMapping, keepProcessing, index);
        expect(result).toBe(true);
    });

    test('validateRequiredFields question1 missing', () => {
        shallowMountWithDefaultStore();

        const question = {};
        const arrayMapping = [
            { required: true, xlsFieldname: 'question' }, 
        ];
        const keepProcessing = true;
        const index = 1;
        const result = wrapper.vm.validateRequiredFields(wrapper.vm, question, arrayMapping, keepProcessing, index);
        expect(result).toBe(false);
    });

    test('parseMultivalueFields', () => {
        shallowMountWithDefaultStore();

        const expectedResult = {
            question1: '1st question',
        };
        const question = {
            question1: '1st question',
        };
        const fieldType = 'string';
        const arrayMapping = [
            { required: true, xlsFieldname: 'question', type: 'string', esFieldname: 'question1' }, 
        ];
        const dstField = [];
        wrapper.vm.parseMultivalueFields(question, fieldType, arrayMapping, dstField);
        expect(question.question1).not.toBeDefined();

        expect(dstField.length).toEqual(1);
        expect(dstField[0]).toEqual(expectedResult);
    });

    test('parseMultivalueFields -- 2 questions', () => {
        shallowMountWithDefaultStore();

        const expectedResult1 = {
            question1: '1st question',
            question2: 'default value',
        };
        const expectedResult2 = {
            question1: '2nd question',
            question2: 'default value',
        }
        const question = {
            question1: '1st question',
            question2: '2nd question',
        };
        const fieldType = 'string';
        const arrayMapping = [
            { required: true, xlsFieldname: 'question', type: 'string', esFieldname: 'question1' }, 
            { required: true, xlsFieldname: 'question', type: 'boolean', esFieldname: 'question2', default: 'default value' }, 
        ];
        const dstField = [];
        wrapper.vm.parseMultivalueFields(question, fieldType, arrayMapping, dstField);
        expect(question.question1).not.toBeDefined();
        expect(question.question2).not.toBeDefined();

        // While this test passes, the results don't add up.
        // Consider investigating later.
        expect(dstField.length).toEqual(2);
        expect(dstField[0]).toEqual(expectedResult1);
        expect(dstField[1]).toEqual(expectedResult2);
    });

    test('questionHasErrors', () => {
        shallowMountWithDefaultStore();

        const noQidQuestion = {
            type: 'qna',
        };
        const noSpaceQidQuestion = {
            qid: 'No Spaces.001',
            q: 'Can qids have spaces?',
            a: 'No',
            type: 'qna',
        };
        const noQuestionQuestion = {
            qid: '1',
            q: '',
            type: 'qna',
        };
        const noAnswerQuestion = {
            qid: '1',
            q: 'I have a question',
            a: '',
            type: 'qna',
        };
        const validQuestion = {
            qid: '1',
            q: 'I have a question',
            a: 'You have an answer',
            type: 'qna',
        };
        const notQnaTypeQuestion = {
            qid: '1',
            type: 'slottype',
        };

        expect(wrapper.vm.questionHasErrorsJSON(wrapper.vm, noQidQuestion, 1)).toBe(true);
        expect(wrapper.vm.$data.errorList.length).toEqual(1);
        expect(wrapper.vm.$data.errorList[0]).toEqual(
            `Error: No QID found for question number: ${1}. The JSON file will not be imported. Please fix and import the file again.`
        );

        expect(wrapper.vm.questionHasErrorsJSON(wrapper.vm, noSpaceQidQuestion, 1)).toBe(true);
        expect(wrapper.vm.$data.errorList.length).toEqual(2);
        expect(wrapper.vm.$data.errorList[1]).toEqual(
            `Error: QID: "${noSpaceQidQuestion.qid}", found for question number: ${1} must have no spaces. The JSON file will not be imported. Please fix and import the file again.`
        );

        expect(wrapper.vm.questionHasErrorsJSON(wrapper.vm, noQuestionQuestion, 1)).toBe(true);
        expect(wrapper.vm.$data.errorList.length).toEqual(3);
        expect(wrapper.vm.$data.errorList[2]).toEqual(
            `Error: No questions found for QID: "${noQuestionQuestion.qid}". The JSON file will not be imported. Please fix and import the file again.`
        );

        expect(wrapper.vm.questionHasErrorsJSON(wrapper.vm, noAnswerQuestion, 1)).toBe(true);
        expect(wrapper.vm.$data.errorList.length).toEqual(4);
        expect(wrapper.vm.$data.errorList[3]).toEqual(
            `Error: No answer found for QID: "${noAnswerQuestion.qid}". Make sure that it also includes valid characters (/[^a-zA-Z0-9-_]/g). The JSON file will not be imported. Please fix and import the file again.`
        );

        expect(wrapper.vm.questionHasErrorsJSON(wrapper.vm, validQuestion, 1)).toBe(false);
        expect(wrapper.vm.$data.errorList.length).toEqual(4);

        expect(wrapper.vm.questionHasErrorsJSON(wrapper.vm, notQnaTypeQuestion, 1)).toBe(false);
        expect(wrapper.vm.$data.errorList.length).toEqual(4);
    });

    test('extractQuestion', () => {
        shallowMountWithDefaultStore();

        const question = {
            'question1': '1st question'
        };
        const result = wrapper.vm.extractQuestion(question);
        expect(result.length).toEqual(1);
        expect(result).toEqual(['1st question']);
    });

    test('processRow -- question has error(s)', () => {
        shallowMountWithDefaultStore();

        const question = {
            // qid: '1',
            q: 'I have a question',
            a: 'You have an answer',
            miscProperty: 'some misc value',
        };
        const headerMapping = {
            qid: 'qid',
            question: 'q',
            answer: 'a',
            miscProperty: 'misc',
        };
        const excelRowNumber = 1;

        wrapper.vm.processRow(wrapper.vm, question, excelRowNumber, headerMapping);
        expect(consoleLogSpy).toHaveBeenCalledWith(`Aborting load of question: ${JSON.stringify(question)}`);
    });

    test('processRow', () => {
        shallowMountWithDefaultStore();

        const question = {
            qid: '1',
            q: 'I have a question',
            a: 'You have an answer',
            miscProperty: 'some misc value',
            cardtitle: 'test title',
            imageurl: 'https://example.com/test.jpg',
            cardsubtitle: 'test subtitle',
            displaytext1: 'Press this button',
            buttonvalue1: 'Button value',
            'period.separated.key': 'dash-separated-value',
        };
        const headerMapping = {
            qid: 'qid',
            question: 'q',
            answer: 'a',
            miscProperty: 'misc',
        };
        const excelRowNumber = 1;

        wrapper.vm.processRow(wrapper.vm, question, excelRowNumber, headerMapping);
        expect(consoleLogSpy).toHaveBeenCalledWith('Processing Session Attributes');
        expect(question.r).toBeDefined();
        expect(question.r.title).toBeDefined();
        expect(question.r.title).toEqual('test title');
        expect(question.r.imageUrl).toBeDefined();
        expect(question.r.imageUrl).toEqual('https://example.com/test.jpg');
        expect(question.r.subTitle).toBeDefined();
        expect(question.r.subTitle).toEqual('test subtitle');
        expect(question.cardtitle).not.toBeDefined();
        expect(question.imageurl).not.toBeDefined();
        expect(question.cardsubtitle).not.toBeDefined();
        expect(question.r.buttons).toBeDefined();
        expect(question.r.buttons.length).toEqual(1);
        expect(question.r.buttons[0].value).toEqual('Button value');
        expect(question.period.separated.key).toBeDefined();
        expect(question.period.separated.key).toEqual('dash-separated-value');
        expect(question['period.separated.key']).not.toBeDefined();
    });
});
