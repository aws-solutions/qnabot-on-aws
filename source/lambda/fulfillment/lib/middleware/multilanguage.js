/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { Comprehend } = require('@aws-sdk/client-comprehend');
const { Translate } = require('@aws-sdk/client-translate');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION || 'us-east-1';
const qnabot = require('qnabot/logging');
const helper = require('../../../../../../../../../../opt/lib/supportedLanguages');
const utterance = require('../../../../../../../../../../opt/lib/fulfillment-event/utterance');

async function get_userLanguages(inputText) {
    const params = {
        Text: inputText, /* required */
    };
    const comprehendClient = new Comprehend(customSdkConfig('C013', { region }));
    const languages = await comprehendClient.detectDominantLanguage(params);
    return languages;
}

async function get_terminologies(sourceLang) {
    const translate = new Translate(customSdkConfig('C015', { region }));
    qnabot.log('Getting registered custom terminologies');
    const configuredTerminologies = await translate.listTerminologies({});
    qnabot.log(`terminology response ${JSON.stringify(configuredTerminologies)}`);
    const sources = configuredTerminologies.TerminologyPropertiesList.filter((t) => t.SourceLanguageCode == sourceLang).map((s) => s.Name);
    qnabot.log(`Filtered Sources ${JSON.stringify(sources)}`);
    return sources;
}

async function get_translation(inputText, sourceLang, targetLang, req) {
    const customTerminologyEnabled = !!_.get(req._settings, 'ENABLE_CUSTOM_TERMINOLOGY');
    qnabot.log(`get translation request ${JSON.stringify(inputText)}`);
    const params = {
        SourceLanguageCode: sourceLang, /* required */
        TargetLanguageCode: targetLang, /* required */
        Text: inputText, /* required */
    };
    qnabot.log('get_translation:', targetLang, 'InputText: ', inputText);
    if (targetLang === sourceLang) {
        qnabot.log(`get_translation: source and target are the same, translation not required.${inputText}`);
        return inputText;
    }
    if (customTerminologyEnabled) {
        qnabot.log('Custom terminology enabled');
        const nativeLanguage = _.get(req._settings, 'NATIVE_LANGUAGE', 'English');
        const languageMap = helper.getSupportedLanguages();
        const nativeLanguageCode = languageMap[nativeLanguage];
        const customTerminologies = await get_terminologies(nativeLanguageCode);
        qnabot.log(`Using custom terminologies ${JSON.stringify(customTerminologies)}`);
        params.TerminologyNames = customTerminologies;
    }
    const translateClient = new Translate(customSdkConfig('C015', { region }));
    try {
        qnabot.log(`Fulfillment params ${JSON.stringify(params)}`);
        const translation = await translateClient.translateText(params);
        qnabot.log(`Translation response ${JSON.stringify(translation)}`);
        return translation.TranslatedText;
    } catch (err) {
        qnabot.log(`warning - error during translation. Returning: ${inputText}`);
        return inputText;
    }
}

function set_userLocale(Languages, userPreferredLocale, defaultConfidenceScore, req) {
    let locale = '';
    const userDetectedLocaleConfidence = Languages.Languages[0].Score;
    let userDetectedLocale = Languages.Languages[0].LanguageCode;
    let isPreferredLanguageDetected = false;

    const languageMap = helper.getSupportedLanguages();
    const nativeLanguage = _.get(req._settings, 'NATIVE_LANGUAGE', 'English');
    const nativeLanguageCode = languageMap[nativeLanguage];
    const backupLang = _.get(req._settings, 'BACKUP_LANGUAGE', 'English');

    qnabot.log('preferred lang', userPreferredLocale);
    for (let i = 0; i <= Languages.Languages.length - 1; i++) {
        qnabot.log(`found lang: ${Languages.Languages[i].LanguageCode}`);
        qnabot.log(`score: ${Languages.Languages[i].Score}`);
        const detected_language = Languages.Languages[i];
        // if detected Language is equal to the language we have in the CFN parameter
        if (detected_language.LanguageCode === nativeLanguageCode && (!userPreferredLocale || userPreferredLocale === detected_language.LanguageCode) && detected_language.Score >= defaultConfidenceScore) {
            qnabot.log("Determined that the detected language by Comprehend and Language parameter in CFN are the same!");
            locale = detected_language.LanguageCode;
            _.set(req.session, 'userDetectedLocale', locale);
            _.set(req, '_locale.localeIdentified', locale);
            _.set(req.session, 'userDetectedLocaleConfidence', detected_language.Score);
            return locale;
        }
        if (Languages.Languages[i].LanguageCode === userPreferredLocale) {
            isPreferredLanguageDetected = true;
            userDetectedLocale = Languages.Languages[i].LanguageCode;
        }
    }
    qnabot.log('isPreferredLanguageDetected', isPreferredLanguageDetected);
    qnabot.log('detected locale', userDetectedLocale);
    qnabot.log('detected Confidence', userDetectedLocaleConfidence);

    _.set(req.session, 'userDetectedLocale', userDetectedLocale);
    _.set(req.session, 'userDetectedLocaleConfidence', userDetectedLocaleConfidence);

    if (userPreferredLocale) {
        locale = userPreferredLocale;
        qnabot.log('set user preference as language to use: ', locale);
    } else if (!userPreferredLocale && userDetectedLocaleConfidence <= defaultConfidenceScore) {
        locale = languageMap[backupLang];  // default to BACKUP_LANGUAGE
        qnabot.log('Detected language confidence too low, defaulting to: ', backupLang);
    } else {
        locale = userDetectedLocale;
        qnabot.log('set detected language as language to use: ', locale);
    }
    _.set(req, '_locale.localeIdentified', locale);
    return locale;
}

async function set_translated_transcript(locale, req) {
    const SessionAttributes = _.get(req, 'session');
    const detectedLocale = SessionAttributes.userDetectedLocale;

    const nativeLang = _.get(req._settings, 'NATIVE_LANGUAGE', 'English');
    const languageMapping  = helper.getSupportedLanguages();

    if (!req.question.toLowerCase().startsWith('qid::')) {
        if (locale === languageMapping[nativeLang] ) {
            qnabot.log('No translation - The Language detected is the same');
        } else if (locale !== languageMapping[nativeLang]) {
            qnabot.log('translate to different locale ', req.question);
            const translation = await get_translation(req.question, locale, languageMapping[nativeLang], req);

            _.set(req, '_translation.QuestionInDifferentLocale', translation);
            _.set(req, 'question', translation);
            qnabot.log('Overriding input question with translation: ', req.question);
        } else if (locale !== '' && locale.charAt(0) !== '%' && detectedLocale && detectedLocale !== '') {
            qnabot.log('Confidence in the detected language high enough. Use Backup Language instead');
            const translation = _get(req, '_translation.QuestionInBackupLanguage');

            _.set(req, '_translation.QuestionInDifferentLocale', translation);
            _.set(req, 'question', translation);
            qnabot.log('Overriding input question with translation: ', req.question);
        } else {
            qnabot.log('not possible to perform language translation');
        }
    } else {
        qnabot.log('Question targeting specified Qid (starts with QID::) - skip translation');
    }
}

async function set_multilang_env(req) {
    // Add QnABot settings for multilanguage support
    qnabot.log('Entering multilanguage Middleware');
    qnabot.debug('req:', req);

    let userLocale = '';
    const defaultConfidenceScore = req._settings.MINIMUM_CONFIDENCE_SCORE;
    const userLanguages = await get_userLanguages(req.question);
    const userPreferredLocale = _.get(req, 'session.qnabotcontext.userPreferredLocale') ? req.session.qnabotcontext.userPreferredLocale : '';
    userLocale = set_userLocale(userLanguages, userPreferredLocale, defaultConfidenceScore, req);
    _.set(req.session, 'qnabotcontext.userLocale', userLocale);
    _.set(req._event, 'origQuestion', req.question);

    const languageMap = helper.getSupportedLanguages();
    const backupLanguage = _.get(req._settings, 'BACKUP_LANGUAGE', 'English');
    let translationtoBackup;
    const localeScore = _.get(req.session, 'userDetectedLocaleConfidence');
    if (userLocale !== languageMap[backupLanguage] || localeScore <=  defaultConfidenceScore) {
        qnabot.log('Translating the question to the Backup Language');
        translationtoBackup = await get_translation(req.question, 'auto', languageMap[backupLanguage], req);
    }
    else {
        qnabot.log('User is asking in Backup Language, no need to do a translation to store in settings');
        translationtoBackup = req.question;
    }
    _.set(req, '_translation.QuestionInBackupLanguage', translationtoBackup);

    const question = req.question;
    const PROTECTED_UTTERANCES = _.get(req._settings, 'PROTECTED_UTTERANCES');
    if (utterance.inIgnoreUtterances(question, PROTECTED_UTTERANCES)) {
        qnabot.log('Question is in utterance ignore list - do not translate.');
        return req;
    }

    await set_translated_transcript(userLocale, req);

    return req;
};

module.exports = {
    set_multilang_env,
    get_userLanguages,
    get_translation,
}
