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
const AWS = require('aws-sdk');
const qnabot = require('qnabot/logging');

async function get_terminologies(sourceLang) {
    const translate = new AWS.Translate();
    qnabot.log('Getting registered custom terminologies');
    const configuredTerminologies = await translate.listTerminologies({}).promise();
    qnabot.log(`terminology response ${JSON.stringify(configuredTerminologies)}`);
    const sources = configuredTerminologies.TerminologyPropertiesList.filter((t) => t.SourceLanguageCode == sourceLang).map((s) => s.Name);
    qnabot.log(`Filtered Sources ${JSON.stringify(sources)}`);
    return sources;
}

async function get_translation(englishText, targetLang, req) {
    qnabot.log('get_translation:', targetLang, 'InputText: ', englishText);
    if (targetLang === 'en') {
        qnabot.log('get_translation: target is en, translation not required. Return english text');
        return englishText;
    }

    const translateClient = new AWS.Translate();
    try {
        const customTerminologyEnabled = _.get(req._settings, 'ENABLE_CUSTOM_TERMINOLOGY');
        qnabot.log(`get translation request ${JSON.stringify(req)}`);

        const params = {
            SourceLanguageCode: 'en', /* required */
            TargetLanguageCode: targetLang, /* required */
            Text: englishText, /* required */
        };
        if (customTerminologyEnabled) {
            const customTerminologies = await get_terminologies('en');
            params.TerminologyNames = customTerminologies;
        }

        qnabot.log('input text:', englishText);
        const translation = await translateClient.translateText(params).promise();
        qnabot.log('translation:', translation);
        const regex = /\s\*\s+$/m;
        translation.TranslatedText = translation.TranslatedText.replace(regex, '*\n\n'); // Translate adds a space between the "*" causing incorrect Markdown
        translation.TranslatedText = translation.TranslatedText.replace(/<\/?span[^>]*>/g, ''); // removes span tag used to keep Translate from translating URLs
        return translation.TranslatedText;
    } catch (err) {
        qnabot.log('warning - error during translation: ', err);
        return englishText;
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
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
            if (obj.enableTranslate) {
                try {
                    hit_out.sa.push({ text: obj.text, value: await get_translation(obj.value, usrLang, req), enableTranslate: obj.enableTranslate });
                } catch (e) {
                    qnabot.log('ERROR: Session Attributes caused Translation exception. Check syntax: ', obj.text);
                    throw (e);
                }
            }
        });
        await Promise.all(promises);
    }
    qnabot.log('Preprocessed Result: ', hit_out);
    return hit_out;
};
