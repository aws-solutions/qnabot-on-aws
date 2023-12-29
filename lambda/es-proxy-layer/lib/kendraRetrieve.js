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
const qnabot = require('qnabot/logging');
const { signS3URL } = require('./signS3URL');
const { retrievalKendra } = require('./kendraClient');
const { getSupportedLanguages } = require('./supportedLanguages');

function createHit(docs, hitCount) {
    if (hitCount <= 0) {
        return null;
    }

    const hit = {
        a: docs,
        alt: {
            markdown: docs,
            ssml: '',
        },
        type: 'text',
        questions: [],
        answersource: 'KENDRA RETRIEVE API',
        hit_count: hitCount,
        debug: [],
    };
    qnabot.log('createHit: ', JSON.stringify(hit, null, 2));
    return hit;
}

function getIndexIDs(req) {
    let parsedIndexes;
    const indexes = req._settings.ALT_SEARCH_KENDRA_INDEXES ? req._settings.ALT_SEARCH_KENDRA_INDEXES : process.env.KENDRA_INDEXES;
    if (indexes && indexes.length) {
        try {
            // parse JSON array of kendra indexes
            parsedIndexes = JSON.parse(indexes);
        } catch (err) {
            // assume setting is a string containing single index
            parsedIndexes = [indexes];
        }
        return parsedIndexes;
    }

    throw new Error('Undefined Kendra Indexes');
}

function getResult(resp, index, signS3Urls, expireSeconds) {
    const r = resp.ResultItems[index];
    const doc_excerpt = r.Content;
    const doc_title = r.DocumentTitle;
    let doc_uri = r.DocumentURI;
    if (signS3Urls) {
        signS3URL(doc_uri, expireSeconds, (url) => {
            doc_uri = url;
        });
    }
    const link = `<span translate=no>[${doc_title}](${doc_uri})</span>`;
    const result = `${doc_excerpt}\n\nSource Link: ${link}`;
    return result;
}

function getQuery(req) {
    const { origQuestion } = req._event;
    const { question } = req;
    const userDetectedLocale = _.get(req, 'session.qnabotcontext.userLocale');
    const standaloneQuery = _.get(req, 'llm_generated_query.concatenated');

    const backupLang = _.get(req._settings, 'BACKUP_LANGUAGE', 'English');
    const supportedLangMap = getSupportedLanguages();
    const backupLangCode = supportedLangMap[backupLang];

    const kendraIndexedLanguages = _.get(
        req._settings,
        'KENDRA_INDEXED_DOCUMENTS_LANGUAGES',
        [backupLangCode],
    );
    qnabot.log(`Retrieved Kendra multi-language settings: ${kendraIndexedLanguages}`);

    let useOriginalLanguageQuery = kendraIndexedLanguages.includes(userDetectedLocale, 0)
        && origQuestion && question && origQuestion != question;
    if (standaloneQuery) {
        useOriginalLanguageQuery = false;
        qnabot.log(`Using LLM generated standalone query: ${standaloneQuery}`);
    }
    qnabot.log(`useOriginalLanguageQuery: ${useOriginalLanguageQuery}`);
    return useOriginalLanguageQuery ? origQuestion : question;
}

async function kendraRetrieve(req) {
    const kcount = _.get(req._settings, 'ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT', 2);
    const signS3Urls = _.get(req._settings, 'ALT_SEARCH_KENDRA_S3_SIGNED_URLS', true);
    const expireSeconds = _.get(req._settings, 'ALT_SEARCH_KENDRA_S3_SIGNED_URL_EXPIRE_SECS', 300);
    const maxRetries = _.get(req._settings, 'KENDRA_FAQ_CONFIG_MAX_RETRIES');
    const retryDelay = _.get(req._settings, 'KENDRA_FAQ_CONFIG_RETRY_DELAY');

    const kindexIDs = getIndexIDs(req);
    const kquery = getQuery(req);
    const kendraParams = {
        IndexId: kindexIDs[0],
        QueryText: kquery.trim(),
        PageSize: parseInt(kcount),
    };
    const response = await retrievalKendra(kendraParams, maxRetries, retryDelay);

    const respLen = response.ResultItems.length;
    qnabot.log('Debug: Retrieve response length: ', respLen);

    // process the results of the retrieve API
    const rCount = respLen > kcount ? kcount : respLen;

    const results = [];
    for (let i = 0; i < rCount; i++) {
        const result = getResult(response, i, signS3Urls, expireSeconds);
        results.push(result);
    }
    const docs = results.join('\n---\n');
    const hit = createHit(docs, rCount);
    return hit;
}

exports.handler = async (req, context) => {
    qnabot.debug(`event: ${JSON.stringify(req, null, 2)}`);
    const hit = await kendraRetrieve(req);

    return hit;
};
