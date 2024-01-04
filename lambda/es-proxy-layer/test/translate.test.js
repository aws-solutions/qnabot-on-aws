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
const _ = require('lodash');
const { Translate } = require('@aws-sdk/client-translate');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('qnabot/logging');
const {translate_hit} = require('../lib/translate');

jest.mock('@aws-sdk/client-translate');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');



const { 
    req,
    hit,
    translatedFields,
} = require('./translate.fixtures')

describe('translate', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const listTerminologiesMock = jest.fn().mockImplementation(() => {
            return {
                TerminologyPropertiesList: [
                    {SourceLanguageCode: 'en', Name: 'test'}
                ]
            }
        });

        const translateTextMock = jest.fn().mockImplementation(() => {
            return {
                TranslatedText: 'translated text'
            }
        });

        Translate.mockImplementation(() => {
            return {
                listTerminologies: listTerminologiesMock,
                translateText: translateTextMock,
            }
        });
    });

    test('translates all fields', async () => {
        const clonedHit = _.cloneDeep(hit);
        const clonedReq = _.cloneDeep(req);
        const usrLang = 'es';

        const listTerminologiesMock = jest.fn().mockImplementation(() => {
            return {
                TerminologyPropertiesList: [
                    {SourceLanguageCode: 'en', Name: 'test'}
                ]
            }
        });

        const translateTextMock = jest.fn().mockImplementation(() => {
            return {
                TranslatedText: 'translated text'
            }
        });

        Translate.mockImplementation(() => {
            return {
                listTerminologies: listTerminologiesMock,
                translateText: translateTextMock,
            }
        });

        const response = await translate_hit(clonedHit, usrLang, clonedReq);

        expect(listTerminologiesMock).toBeCalledWith({});
        expect(translateTextMock).toBeCalledTimes(9);
        expect(translateTextMock).toBeCalledWith({
            SourceLanguageCode: 'auto',
            TargetLanguageCode: 'es',
            TerminologyNames: ['test'],
            Text: 'answer',
        });
        translatedFields.forEach((field) => {
            expect( _.get(response, field)).toBe('translated text')
        });
    });

    test('does not use custom terminologies if disabled', async () => {
        const hit = {
            a: 'answer',
            autotranslate: {
                a: true,
            },
        };
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ENABLE_CUSTOM_TERMINOLOGY = false;
        const usrLang = 'es';

        const listTerminologiesMock = jest.fn().mockImplementation(() => {
            return {
                TerminologyPropertiesList: [
                    {SourceLanguageCode: 'en', Name: 'test'}
                ]
            }
        });

        const translateTextMock = jest.fn().mockImplementation(() => {
            return {
                TranslatedText: 'translated text'
            }
        });

        Translate.mockImplementation(() => {
            return {
                listTerminologies: listTerminologiesMock,
                translateText: translateTextMock,
            }
        });
    
        await translate_hit(hit, usrLang, clonedReq);

        expect(listTerminologiesMock).not.toBeCalled();
        expect(translateTextMock).toBeCalledWith({
            SourceLanguageCode: 'auto',
            TargetLanguageCode: 'es',
            Text: 'answer',
        });
    });

    test('does not translate if language matches native language', async () => {
        const clonedHit = _.cloneDeep(hit);
        const clonedReq = _.cloneDeep(req);
        const usrLang = 'en';

        const response = await translate_hit(clonedHit, usrLang, clonedReq);

        translatedFields.forEach((field) => {
            expect(_.get(response, field)).toBe(_.get(hit, field))
        });
    });

    test('does not translate if autotranslate is disabled', async () => {
        const clonedHit = _.cloneDeep(hit);
        clonedHit.autotranslate = {};
        clonedHit.sa[0].enableTranslate = false;
        const clonedReq = _.cloneDeep(req);
        const usrLang = 'es';

        const response = await translate_hit(clonedHit, usrLang, clonedReq);

        translatedFields.forEach((field) => {
            expect(_.get(response, field)).toBe(_.get(hit, field))
        });
    });

    test('does not translate if error is thrown by translate', async () => {
        const clonedHit = _.cloneDeep(hit);
        const clonedReq = _.cloneDeep(req);
        const usrLang = 'es';

        const translateTextMock = jest.fn().mockImplementation(() => {
            throw new Error('test error')
        });

        Translate.mockImplementation(() => {
            return {
                translateText: translateTextMock,
            }
        });
        
        const response = await translate_hit(clonedHit, usrLang, clonedReq);

        translatedFields.forEach((field) => {
            expect(_.get(response, field)).toBe(_.get(hit, field))
        });
    });

    test('throws unknown errors', async () => {
        let clonedHit = _.cloneDeep(hit);
        const clonedReq = _.cloneDeep(req);
        const usrLang = 'es';

        Translate.mockImplementation(() => {
            throw new Error('unknown error')
        });
        
        try {
            await translate_hit(clonedHit, usrLang, clonedReq);
            expect(true).toBe(false);
        } catch (err) {
            expect(err.message).toBe('unknown error');
        }
        
        try {
            clonedHit = _.cloneDeep(hit);
            clonedHit.autotranslate = {};
            clonedHit.r = undefined;
            await translate_hit(clonedHit, usrLang, clonedReq);
            expect(true).toBe(false);
        } catch (err) {
            expect(err.message).toBe('unknown error');
        }
        
        try {
            clonedHit = _.cloneDeep(hit);
            clonedHit.autotranslate = {
                r: {
                    buttons: {
                        x: {
                            text: true,
                        }
                    }
                }
            };
            await translate_hit(clonedHit, usrLang, clonedReq);
            expect(true).toBe(false);
        } catch (err) {
            expect(err.message).toBe('unknown error');
        }
        
        try {
            clonedHit = _.cloneDeep(hit);
            clonedHit.autotranslate = {
                r: {
                    buttons: {
                        x: {
                            value: true,
                        }
                    }
                }
            };
            await translate_hit(clonedHit, usrLang, clonedReq);
            expect(true).toBe(false);
        } catch (err) {
            expect(err.message).toBe('unknown error');
        }
    });

});
