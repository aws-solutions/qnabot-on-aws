/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const multilanguage = require('../../../lib/middleware/multilanguage');
const awsMock = require('aws-sdk-client-mock');
const multilanguageFixtures = require('./multilanguage.fixtures')
const { ComprehendClient, DetectDominantLanguageCommand } = require('@aws-sdk/client-comprehend');
const { TranslateClient, TranslateTextCommand, ListTerminologiesCommand } = require('@aws-sdk/client-translate');
const comprehendMock = awsMock.mockClient(ComprehendClient);
const translateMock = awsMock.mockClient(TranslateClient);

describe('when calling translateText function', () => {
    beforeEach(() => {
        comprehendMock.reset();
        translateMock.reset();
    });

    test('should translate text successfully', async () => {
        translateMock.on(TranslateTextCommand).resolves(multilanguageFixtures.translateTextCommandResponse);
        const result = await multilanguage.get_translation('Test text to translate', 'en', 'es', multilanguageFixtures.requestObject);
        expect(result).toEqual('Texto de prueba para traducir');
    });
});

describe('when calling get_translation function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should translate text successfully', async () => {
        translateMock.on(TranslateTextCommand).resolves(multilanguageFixtures.translateTextCommandResponse);
        const result = await multilanguage.get_translation('Test text to translate', 'en', 'es', multilanguageFixtures.requestObject);
        expect(result).toEqual('Texto de prueba para traducir');
    });

    test('should translate text when custom terminology is enabled', async () => {
        translateMock.on(TranslateTextCommand).resolves(multilanguageFixtures.translateTextCommandResponse);
        translateMock.on(ListTerminologiesCommand).resolves(multilanguageFixtures.listTerminologiesCommandResponse);
        const result = await multilanguage.get_translation('Test text to translate', 'en', 'es',
            multilanguageFixtures.requestObjectCustomTerminologyEnabled);
        expect(result).toEqual('Texto de prueba para traducir');
    });

    test('should not call translate if source and target are the same', async () => {
        let spyTranslate = jest.fn(() => multilanguageFixtures.translateTextCommandResponse);
        translateMock.on(TranslateTextCommand).callsFake(() => {
            return spyTranslate();
        });
        const result = await multilanguage.get_translation('Test text to translate', 'en', 'en', multilanguageFixtures.requestObject);
        expect(result).toEqual('Test text to translate');
        expect(spyTranslate).not.toHaveBeenCalled();
    });

    test('should return the same text if translate fails', async () => {
        translateMock.on(TranslateTextCommand).rejects('mocked rejection');
        const result = await multilanguage.get_translation('Test text to translate', 'en', 'es', multilanguageFixtures.requestObject);
        expect(result).toEqual('Test text to translate');
    });
});

describe('when calling set_multilang_env function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    test('set multi lang environment in request when userPreferredLocale is set', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves(
            multilanguageFixtures.detectDominantLanguageCommandResponseEnglish
        );
        const updatedRequest = await multilanguage.set_multilang_env(multilanguageFixtures.createRequestObject("What is QnABot", "en"));
        expect(updatedRequest.session.qnabotcontext.userLocale).toEqual("en");
        expect(updatedRequest.session.userDetectedLocale).toEqual("en");
        expect(updatedRequest._event.origQuestion).toBeDefined();
        expect(updatedRequest._translation).toEqual({"QuestionInBackupLanguage": "What is QnABot", "QuestionInDifferentLocale": "What is QnABot"});
        expect(updatedRequest.session.userDetectedLocaleConfidence).toEqual(1);
    });

    test('Multi-Language do not translated protected Utterance', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves(
            multilanguageFixtures.detectDominantLanguageCommandResponseEnglish
        );
        const updatedRequest = await multilanguage.set_multilang_env(multilanguageFixtures.createRequestObject("Thumbs up", "en"));
        expect(updatedRequest.session.qnabotcontext.userLocale).toEqual("en");
        expect(updatedRequest.session.userDetectedLocale).toEqual("en");
        expect(updatedRequest._event.origQuestion).toBeDefined();
    });

    test('set multi lang environment in request when userPreferredLocale is not set', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves(
            multilanguageFixtures.detectDominantLanguageCommandResponseEnglish
        );
        translateMock.on(TranslateTextCommand).resolves(multilanguageFixtures.translateTextCommandResponseEnglish);
        const updatedRequest = await multilanguage.set_multilang_env(multilanguageFixtures.createRequestObject("What is QnABot", null));

        expect(updatedRequest.session.qnabotcontext.userLocale).toEqual("en");
        expect(updatedRequest.session.userDetectedLocale).toEqual("en");
        expect(updatedRequest.session.userDetectedLocaleConfidence).toEqual(1);
        expect(updatedRequest._event.origQuestion).toEqual('What is QnABot');
    });

    test('set multi lang environment in request with null userPreferredLocale in Spanish', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves(
            multilanguageFixtures.detectDominantLanguageCommandResponseSpanish
        );
        translateMock.on(TranslateTextCommand).resolves(multilanguageFixtures.translateTextCommandResponseEnglish);
        const updatedRequest = await multilanguage.set_multilang_env(multilanguageFixtures.createRequestObject("¿Qué es QnABot?", null));

        expect(updatedRequest.session.qnabotcontext.userLocale).toEqual("es");
        expect(updatedRequest.session.userDetectedLocale).toEqual("es");
        expect(updatedRequest.session.userDetectedLocaleConfidence).toEqual(1);
        expect(updatedRequest._event.origQuestion).toBeDefined();
        expect(updatedRequest._translation.QuestionInBackupLanguage).toEqual('What is QnABot');
    });
    
    test('set multi lang environment in request with null userPreferredLocale in French', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves(
            multilanguageFixtures.detectDominantLanguageCommandResponseFrench
        );
        translateMock.on(TranslateTextCommand).resolves(multilanguageFixtures.translateTextCommandResponseQuestionSpanish);
        const updatedRequest = await multilanguage.set_multilang_env(multilanguageFixtures.createRequestObject("Comment est la temps?", null));

        expect(updatedRequest.session.qnabotcontext.userLocale).toEqual("fr");
        expect(updatedRequest.session.userDetectedLocale).toEqual("fr");
        expect(updatedRequest.session.userDetectedLocaleConfidence).toEqual(1);
        expect(updatedRequest._event.origQuestion).toBeDefined();
        expect(updatedRequest._translation).toEqual({"QuestionInBackupLanguage": "¿Como está el clima?", "QuestionInDifferentLocale": "¿Como está el clima?"});
    });
   
    test('set multi lang environment in request with setting containing userPreferredLocale', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves(
            multilanguageFixtures.detectDominantLanguageCommandResponseMultiple
        );
        translateMock.on(TranslateTextCommand).resolves(multilanguageFixtures.translateTextCommandResponseEnglish);
        const updatedRequest = await multilanguage.set_multilang_env(multilanguageFixtures.createRequestObject("¿Qué es QnABot?", 'es'));

        expect(updatedRequest.session.qnabotcontext.userLocale).toEqual("es");
        expect(updatedRequest.session.userDetectedLocale).toEqual("es");
        expect(updatedRequest.session.userDetectedLocaleConfidence).toEqual(0.8);
        expect(updatedRequest._event.origQuestion).toBeDefined();
        expect(updatedRequest._translation.QuestionInBackupLanguage).toEqual('What is QnABot');
        expect(updatedRequest._locale.localeIdentified).toEqual('es');
    });


    test('should default to english if detected confidence is lower than threshold', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves(
            multilanguageFixtures.detectDominantLanguageCommandResponseLowConfidence
        );
        translateMock.on(TranslateTextCommand).resolves(multilanguageFixtures.translateTextCommandResponseEnglish);
        const updatedRequest = await multilanguage.set_multilang_env(multilanguageFixtures.createRequestObject("Qué is QnABot", null));

        expect(updatedRequest.session.userDetectedLocale).toEqual("es");
        expect(updatedRequest._locale.localeIdentified).toEqual("en");
        expect(updatedRequest._event.origQuestion).toBeDefined();
        expect(updatedRequest._translation).toEqual({"QuestionInBackupLanguage": "What is QnABot", "QuestionInDifferentLocale": "What is QnABot"});
    });

    test('should not translate question starting with qid::', async () => {
        comprehendMock.on(DetectDominantLanguageCommand).resolves(
            multilanguageFixtures.detectDominantLanguageCommandResponseEnglish
        );
        const updatedRequest = await multilanguage.set_multilang_env(multilanguageFixtures.createRequestObject("qid::What is QnABot", null));
        expect(updatedRequest.session.qnabotcontext.userLocale).toEqual("en");
        expect(updatedRequest.session.userDetectedLocale).toEqual("en");
        expect(updatedRequest._event.origQuestion).toBeDefined();
        expect(updatedRequest._translation.QuestionInBackupLanguage).toEqual("qid::What is QnABot");
    }); 

});