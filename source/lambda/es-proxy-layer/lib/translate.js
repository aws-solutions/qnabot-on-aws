/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { Translate } = require('@aws-sdk/client-translate');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('qnabot/logging');
const { getSupportedLanguages } = require('./supportedLanguages');
const region = process.env.AWS_REGION || 'us-east-1';

async function get_terminologies(sourceLang) {
    const translate = new Translate(customSdkConfig('C015', { region }));
    qnabot.log('Getting registered custom terminologies');
    const configuredTerminologies = await translate.listTerminologies({});
    qnabot.log(`terminology response ${JSON.stringify(configuredTerminologies)}`);
    const sources = configuredTerminologies.TerminologyPropertiesList.filter((t) => t.SourceLanguageCode == sourceLang).map((s) => s.Name);
    qnabot.log(`Filtered Sources ${JSON.stringify(sources)}`);
    return sources;
}

async function get_translation(userText, targetLang, req) {
    qnabot.log('get_translation:', targetLang, 'InputText: ', userText);
    const nativeLang = _.get(req._settings, 'NATIVE_LANGUAGE', 'English');
    const supportedLangMap = getSupportedLanguages();
    const nativeLangCode = supportedLangMap[nativeLang];
    if (targetLang === nativeLangCode) {
        qnabot.log('get_translation: target is the same language that was chosen by the user for this deployment.');
        return userText;
    }

    const translateClient = new Translate(customSdkConfig('C015', { region }));
    try {
        const customTerminologyEnabled = _.get(req._settings, 'ENABLE_CUSTOM_TERMINOLOGY');
        qnabot.log(`get translation request ${JSON.stringify(req)}`);

        const params = {
            SourceLanguageCode: 'auto', /* required */
            TargetLanguageCode: targetLang, /* required */
            Text: userText, /* required */
        };
        if (customTerminologyEnabled) {
            const nativeLanguage = _.get(req._settings, 'NATIVE_LANGUAGE', 'English');
            const languageMap = getSupportedLanguages();
            const nativeLanguageCode = languageMap[nativeLanguage];
            const customTerminologies = await get_terminologies(nativeLanguageCode);
            params.TerminologyNames = customTerminologies;
        }

        qnabot.log('input text:', userText);
        const translation = await translateClient.translateText(params);
        qnabot.log('translation:', translation);
        const regex = /\s\*\s+$/m;
        translation.TranslatedText = translation.TranslatedText.replace(regex, '*\n\n'); // Translate adds a space between the "*" causing incorrect Markdown
        translation.TranslatedText = translation.TranslatedText.replace(/<\/?span[^>]*>/g, ''); // removes span tag used to keep Translate from translating URLs
        translation.TranslatedText = translation.TranslatedText.replaceAll('] (', ']('); // Removes space between markdown links that is added after translation
        return translation.TranslatedText;
    } catch (err) {
        qnabot.log('warning - error during translation: ', err);
        return userText;
    }
}


async function translateField(field, hit, usrLang, req) {
    const fieldValue = _.get(hit, field);
    if (fieldValue && _.get(hit, `autotranslate.${field}`)) {
        try {
            return await get_translation(fieldValue, usrLang, req);
        } catch (e) {
            qnabot.log(`ERROR: Field ${field} caused Translate exception: ${fieldValue}`);
            throw (e);
        }
    }
    return fieldValue;
}

async function translateButtons(hit, usrLang, req) {
    const buttons = _.cloneDeep(hit.r.buttons);

    for (const button of buttons) {
        if (button.text && _.get(hit, 'autotranslate.r.buttons.x.text')) {
            try {
                button.text = await get_translation(button.text, usrLang, req);
            } catch (e) {
                qnabot.log(`ERROR: Button text caused Translate exception: ${button.text}`);
            }
        }
        if (button.value && !button.value.toLowerCase().startsWith('qid::') && _.get(hit, 'autotranslate.r.buttons.x.value')) {
            try {
                button.value = await get_translation(button.value, usrLang, req);
            } catch (e) {
                qnabot.log(`ERROR: Button value caused Translate exception: ${button.value}`);
            }
        }
    }

    return buttons;
}

exports.translate_hit = async function (hit, usrLang, req) {
    qnabot.log('translate_hit:', JSON.stringify(hit, null, 2));
    const hit_out = _.cloneDeep(hit);

    const translateFields = ['a', 'alt.markdown', 'alt.ssml', 'rp', 'r.subTitle', 'r.title'];
    const filteredTranslateFields = translateFields.filter((field) => !!_.get(hit, field));

    // catch and log errors before throwing exception.
    for (const element of filteredTranslateFields) {
        const translatedValue = await translateField(element, hit, usrLang, req);
        _.set(hit_out, element, translatedValue);
    }

    if (hit.r?.buttons?.length > 0) {
        hit_out.r.buttons = await translateButtons(hit, usrLang, req);
    }

    // session attributes
    if (_.get(hit, 'sa')) {
        hit_out.sa = [];
        const promises = hit.sa.map(async (obj) => {
            const objOut = { ...obj };
            if (obj.enableTranslate) {
                try {
                    objOut.value = await get_translation(obj.value, usrLang, req);
                } catch (e) {
                    qnabot.log('ERROR: Session Attributes caused Translation exception. Check syntax: ', obj.text);
                    throw (e);
                }
            }
            hit_out.sa.push(objOut);
        });
        await Promise.all(promises);
    }
    qnabot.log('Preprocessed Result: ', hit_out);
    return hit_out;
};
