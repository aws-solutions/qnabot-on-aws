/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const kendra = require('../kendraQuery');
const { determineKendraLanguage } = require('../kendraClient');

async function runKendraQuery(req, query_params) {
    qnabot.log(`Querying Kendra FAQ index: ${_.get(req, '_settings.KENDRA_FAQ_INDEX')}`);
    const language = determineKendraLanguage(req);
    console.debug('runKendraQuery.js , language determined is: ', language);
    // calls kendraQuery function which duplicates KendraFallback code, but only searches through FAQs
    const request_params = {
        kendra_faq_index: _.get(req, '_settings.KENDRA_FAQ_INDEX'),
        maxRetries: _.get(req, '_settings.KENDRA_FAQ_CONFIG_MAX_RETRIES'),
        retryDelay: _.get(req, '_settings.KENDRA_FAQ_CONFIG_RETRY_DELAY'),
        minimum_score: _.get(req, '_settings.ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE'),
        size: 1,
        question: query_params.question,
        es_address: req._info.es.address,
        es_path: `/${req._info.es.index}/_search?search_type=dfs_query_then_fetch`,
        language:language,
    };

    // optimize kendra queries for throttling by checking if KendraFallback idxs include KendraFAQIndex
    let alt_kendra_idxs = _.get(req, '_settings.ALT_SEARCH_KENDRA_INDEXES');
    if (alt_kendra_idxs && alt_kendra_idxs.length) {
        alt_kendra_idxs = alt_kendra_idxs.split(',').map((item) => item.trim());
    }
    if (alt_kendra_idxs.includes(request_params.kendra_faq_index)) {
        qnabot.debug('optimizing for KendraFallback');
        request_params.same_index = true;
    }

    const kendra_response = await kendra.handler(request_params);
    if (_.get(kendra_response, 'hits.hits[0]._source')) {
        _.set(kendra_response, 'hits.hits[0]._source.answersource', 'Kendra FAQ');
    }
    return kendra_response;
}
exports.runKendraQuery = runKendraQuery;
