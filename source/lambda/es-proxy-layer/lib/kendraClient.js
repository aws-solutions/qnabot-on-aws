/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { ConfiguredRetryStrategy } = require('@smithy/util-retry');
const { Kendra } = require('@aws-sdk/client-kendra');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('qnabot/logging');
const { getSupportedLanguages, getKendraSupportedLanguages } = require('./supportedLanguages');


const region = process.env.AWS_REGION || 'us-east-1';

function getKendraClient(maxRetries, retryDelay) {
    const retryStrategy = new ConfiguredRetryStrategy(maxRetries + 1, retryDelay);

    const kendraClient = (process.env.REGION
        ? new Kendra(customSdkConfig('C007', { apiVersion: '2019-02-03', region: process.env.REGION, retryStrategy }))
        : new Kendra(customSdkConfig('C007', { apiVersion: '2019-02-03' , region, retryStrategy }))
    );

    return kendraClient;
}

/**
 * Function to query kendraClient and return results via Promise
 * @param resArray
 * @param index
 * @param query
 * @param kendraArgs
 * @param maxRetries
 * @param retryDelay
 * @returns {*}
 */
function queryKendra(resArray, kendraArgs, maxRetries, retryDelay, usrContext, params) {
    const kendraClient = getKendraClient(maxRetries, retryDelay);
    qnabot.log('Params for queryKendra: ', params);

    if (!_.isEmpty(usrContext)) {
        params.UserContext = usrContext;
    }

    qnabot.log(`Kendra query args: ${kendraArgs}`);
    for (const argString of kendraArgs) {
        qnabot.log(`Adding parameter '${argString}'`);
        const argJSON = `{ ${argString} }`; // convert k:v to a JSON obj
        const arg = JSON.parse(argJSON);
        params = _.assign(params, arg);
    }

    return new Promise((resolve, reject) => {
        qnabot.log(`Kendra request params:${JSON.stringify(params, null, 2)}`);
        kendraClient.query(params, (err, data) => {
            const indexId = params.IndexId;
            if (err) {
                qnabot.log(err, err.stack);
                reject(`Error from Kendra query request:${err}`);
            } else {
                data.originalKendraIndexId = indexId;
                qnabot.log(`Kendra response:${JSON.stringify(data, null, 2)}`);
                resArray.push(data);
                resolve(data);
            }
        });
    });
}

async function retrievalKendra(params, maxRetries, retryDelay) {
    const kendraClient = getKendraClient(maxRetries, retryDelay);
    const response = await kendraClient.retrieve(params);
    qnabot.log('Debug: Retrieve API response: ', JSON.stringify(response, null, 2));
    return response;
}

function determineKendraLanguage(req) {
    if(!req) {
        return 'en';
    }
    // First detect if user is asking in a different language and see if the kendra query
    // text is original text or translated text. Also confirm if that locale is supported in Kendra
    let languageCode = _.get(req, 'session.qnabotcontext.userLocale');
    const origQuestion =  _.get(req, '_event.origQuestion');
    const question = _.get(req, 'question');
    const useOriginal = shouldUseOriginalLanguageQuery(req, origQuestion, question);
    languageCode = useOriginal ? languageCode : '';
    
    const kendraSupportedLangMap = getKendraSupportedLanguages();
    const nativelang = _.get(req._settings, 'NATIVE_LANGUAGE');
    const supportedLanguagesMap = getSupportedLanguages();
    let nativelangCode = supportedLanguagesMap[nativelang];
    const nativeLangSupported = kendraSupportedLangMap[nativelangCode];
    nativelangCode = nativeLangSupported ? nativelangCode : '';
    // If nothing is found use the Native language if that is supported in Kendra. Else lastly default to English
    const langCode = kendraSupportedLangMap[languageCode] ? languageCode : nativelangCode;
    let language = langCode ? langCode : 'en' ;
    qnabot.debug('language is determined to be: ', language);
    return language;
}

function shouldUseOriginalLanguageQuery(req, origQuestion, question) {
    const userDetectedLocale = _.get(req, 'session.qnabotcontext.userLocale');
    const standaloneQuery = _.get(req, 'llm_generated_query.concatenated');
    const backupLang = _.get(req, '_settings.BACKUP_LANGUAGE', 'English');
    const supportedLangMap = getSupportedLanguages();
    const backupLangCode = supportedLangMap[backupLang];
    const kendraIndexedLanguages = _.get(
        req._settings,
        'KENDRA_INDEXED_DOCUMENTS_LANGUAGES',
        [backupLangCode],
    );
    qnabot.debug(`Retrieved Kendra multi-language settings: ${kendraIndexedLanguages}`);

    let useOriginalLanguageQuery = kendraIndexedLanguages.includes(userDetectedLocale, 0)
        && origQuestion && question && origQuestion !== question;
    if (standaloneQuery) {
        useOriginalLanguageQuery = false;
        qnabot.log(`Using LLM generated standalone query: ${standaloneQuery}`);
    }
    if (req.kendraRedirect) {
        useOriginalLanguageQuery = false;
        qnabot.log('Kendra redirect detected, not using original language query');
    }
    qnabot.log(`useOriginalLanguageQuery: ${useOriginalLanguageQuery}`);
    return useOriginalLanguageQuery;
}

function getKendraIndexToken(req) {
    if (!req) {
        return {};
    }
    const useKendraTokenAuth = _.get(req._settings, 'ALT_SEARCH_KENDRA_INDEX_AUTH');
    const isVerifiedIdentity = _.get(req._userInfo, 'isVerifiedIdentity');
    if (useKendraTokenAuth === true && isVerifiedIdentity === 'true') {
        qnabot.log(`PASSING TOKEN AUTH TO KENDRA:: isVerifiedIdentity: ${isVerifiedIdentity} and ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH: ${useKendraTokenAuth}`);
        const idtokenjwt = _.get(req.session, 'idtokenjwt');
        const usrContext = { Token: idtokenjwt };
        return usrContext;
    }
    qnabot.log(`NOT PASSING TOKEN AUTH TO KENDRA:: isVerifiedIdentity: ${isVerifiedIdentity} and ALT_SEARCH_KENDRA_INDEXES_TOKEN_AUTH: ${useKendraTokenAuth}`)
    return {};
}

module.exports = {
    queryKendra,
    retrievalKendra,
    determineKendraLanguage,
    shouldUseOriginalLanguageQuery,
    getKendraIndexToken,
};
