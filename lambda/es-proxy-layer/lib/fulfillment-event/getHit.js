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
const handlebars = require('../handlebars');
const kendra_fallback = require('../kendra');
const kendra_retrieve = require('../kendraRetrieve');
const open_es = require('../es_query');
const { invokeLambda } = require('./invokeLambda');
const { runKendraQuery } = require('./runKendraQuery');
const { encryptor } = require('./encryptor');
const { runLlmQa } = require('./runLlmQa');
const { updateResWithHit } = require('./updateResWithHit');

async function runQuery(req, query_params, kendraIndex) {
    query_params.kendraIndex = kendraIndex;
    const onlyES = await open_es.isESonly(req, query_params);
    let response = '';
    // runs kendra query if question supported on Kendra and KENDRA_FAQ_INDEX is set
    if (!onlyES) {
        response = await runKendraQuery(req, query_params);
    } else {
        response = await open_es.run_query_es(req, query_params);
    }
    return response;
}
function getSourceLinksFromPassages(inputText) {
    const sourceLinkPattern = /^\s*Source Link:(.*)$/gm;
    let matches;
    const sourceLinks = [];

    while ((matches = sourceLinkPattern.exec(inputText)) !== null) {
        sourceLinks.push(matches[1].trim().replace(/(^")|("$)/g, ''));
    }

    const uniqueLinks = [...new Set(sourceLinks)];
    return uniqueLinks.length > 0 ? `Sources: ${uniqueLinks.join(', ')}` : '';
}

async function kendraFallback(req, hit, res) {
    let errors = [];
    if (req._settings.LLM_QA_ENABLE && req._settings.LLM_QA_USE_KENDRA_RETRIEVAL_API) {
        qnabot.log(`Kendra Fallback using Retrieve API: ${JSON.stringify(req)}`);
        hit = await kendra_retrieve.handler(req, res);
        qnabot.log('Kendra Fallback result: ', JSON.stringify(hit, null, 2));
    }
    // if we still don't have a hit, either retrieval was skipped or failed. Try the Query API
    if (!hit) {
        qnabot.log(`Kendra Fallback using Query API: ${JSON.stringify(req)}`);
        hit = await kendra_fallback.handler({ req, res });
        qnabot.log(`Result from Kendra Fallback ${JSON.stringify(hit)}`);
    }
    if (hit && hit.hit_count != 0) {
        hit.refMarkdown = getSourceLinksFromPassages(hit.alt.markdown);
        // Run any configured QA Summary LLM model options on Kendra results
        [hit, errors] = await runLlmQa(req, hit);
        if (hit) {
            _.set(res, 'answersource', 'Kendra Fallback');
            _.set(res, 'session.qnabot_gotanswer', true);
            _.set(res, 'message', hit.a);
            _.set(req, 'debug', hit.debug);
            res.got_hits = 1;
        }
    }
    return [req, res, hit, errors];
}

function encryptConditionalChainingIfSet(hit) {
    const conditionalChaining = _.get(hit, 'conditionalChaining');
    if (conditionalChaining) {
        qnabot.log('Encrypt conditionalChaining rule to ensure it is tamper proof in session attributes');
        const encrypted = encryptor.encrypt(conditionalChaining);
        _.set(hit, 'conditionalChaining', encrypted);
    }
    return hit;
}

async function getNoHitsResponse(noHitsQuestion, query_params, res, req, KENDRA_FAQ_INDEX) {
    qnabot.log(`No hits from query - searching instead for: ${noHitsQuestion}`);
    query_params.question = noHitsQuestion;
    query_params.score_text_passage = false;
    query_params.size = 1;
    res.got_hits = 0; // response flag, used in logging / kibana
    const response = await runQuery(req, query_params, KENDRA_FAQ_INDEX);
    const noHitsRes = _.get(response, 'hits.hits[0]._source');
    qnabot.log(`No hits response: ${JSON.stringify(noHitsRes)}`);
    return noHitsRes;
}

function setSessionTopic(hit, res) {
    qnabot.log(`Setting topic for ${JSON.stringify(hit)}`);
    // set res topic from document before running handlebars, so that handlebars can access or overwrite it.
    _.set(res, 'session.topic', _.get(hit, 't'));

    if (_.get(hit, 't')) {
        if (!res._userInfo) {
            res._userInfo = {};
        }
        if (!res._userInfo.recentTopics) {
            res._userInfo.recentTopics = [];
        }
        res._userInfo.recentTopics.push({
            topic: _.get(hit, 't'),
            dateTime: new Date().toISOString(),
        });
    }
    return res;
}

async function invokeLambdaHook(hit, req, res) {
    // Call Lambda Hook with args now & override running as middleware step (old behavior)
    // This results in:
    //  - improved predictability of document chaining behavior.. each doc's lambda is run as it is chained
    //  - autotranslation is now applied to lambda hook responses by default when response is assembled
    // optional setting to turn off this behaviour if it causes problems, and revert to old way
    const lambdaHook = _.get(hit, 'l');
    if (lambdaHook) {
        qnabot.log('Invoking Lambda Hook function: ', lambdaHook);
        [req, res] = await invokeLambda(lambdaHook, req, res);
        // update hit with values returned in res by lambda hook
        _.set(hit, 'a', _.get(res, 'message', ''));
        const markdown = _.get(res, 'session.appContext.altMessages.markdown', '');
        const ssml = _.get(res, 'session.appContext.altMessages.ssml', '');
        const card = _.get(res, 'card', {});
        _.set(hit, 'alt.markdown', markdown);
        _.set(hit, 'alt.ssml', ssml);
        _.set(hit, 'r', card);
    }
    _.set(hit, 'l', '');
    _.set(hit, 'args', []);
    return [req, res, hit];
}

function copyPassageFieldToAnswerFields(hit) {
    if (hit.passage && !hit.a) {
        // Set the answer (a) field to match the text item passage field.
        hit.a = hit.passage;
    }
    if (!_.get(hit, 'alt.markdown')) {
        _.set(hit, 'alt.markdown', hit.a);
    }
    if (!_.get(hit, 'alt.ssml')) {
        _.set(hit, 'alt.ssml', hit.a);
    }

    return hit;
}

async function runFirstQuery(req, query_params, KENDRA_FAQ_INDEX, res) {
    const response = await runQuery(req, query_params, KENDRA_FAQ_INDEX);
    qnabot.log('Query response: ', JSON.stringify(response, null, 2));
    const hit = _.get(response, 'hits.hits[0]._source');

    _.set(res, 'kendraResultsCached', response.kendraResultsCached);
    if (response.kendraResultsCached) qnabot.debug('kendra results cached in res structure');
    _.set(req, 'session.qnabotcontext.kendra', response.kendra_context);
    if (response.kendra_context) qnabot.log('kendra context set in res session');
    return [req, res, hit];
}

async function opensearchFallback(req, query_params) {
    qnabot.log('ElasticSearch Fallback');
    const response = await open_es.run_query_es(req, query_params);
    if (_.get(response, 'hits.hits[0]._source')) {
        _.set(response, 'hits.hits[0]._source.answersource', 'ElasticSearch Fallback');
    }
    const osFallbackHit = _.get(response, 'hits.hits[0]._source');
    return osFallbackHit;
}

async function kendraRedirect(hit, req, res, ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE, query_params) {
    let redirect = {
        kendraRedirectQueryText: _.get(hit, 'kendraRedirectQueryText'),
        kendraRedirectQueryArgs: _.get(hit, 'kendraRedirectQueryArgs', []),
    };
    // process any handlebars before running Kendra redirect query
    qnabot.log('Kendra redirect query: Process with handlebars before redirecting.');
    redirect = await handlebars(req, res, redirect);
    const kendraRedirectQueryText = _.get(redirect, 'kendraRedirectQueryText');
    const kendraRedirectQueryArgs = _.get(redirect, 'kendraRedirectQueryArgs', []);
    const kendraRedirectQueryConfidenceThreshold = _.get(
        hit,
        'kendraRedirectQueryConfidenceThreshold',
        ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE,
    );
    qnabot.log(`Kendra redirect query: '${kendraRedirectQueryText}' - Args = '${kendraRedirectQueryArgs}'`);
    qnabot.log(`Kendra redirect query confidence threshold: '${kendraRedirectQueryConfidenceThreshold}'`);
    req.question = kendraRedirectQueryText;
    req.kendraQueryArgs = kendraRedirectQueryArgs;
    req._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = kendraRedirectQueryConfidenceThreshold;
    // remove any cached results from FAQ query
    delete res.kendraResultsCached;
    const redirect_hit = await kendra_fallback.handler({ req, res });
    if (redirect_hit) {
        qnabot.log(`Result from Kendra Redirect query: ${JSON.stringify(redirect_hit)}`);
        hit.answersource = 'KENDRA REDIRECT';
        hit.a = _.get(redirect_hit, 'a');
        hit.alt = _.get(redirect_hit, 'alt');
    } else {
        qnabot.log('Kendra Redirect query returned no hits. Disable Kendra fallback query.');
        query_params.kendra_indexes = '';
        hit = null;
    }

    return [req, res, hit];
}

function getQuestion(req) {
    let { question } = req;
    const qid = _.get(req, 'qid');
    if (qid) {
        question = `QID::${qid}`;
        qnabot.log(`*** QID identified in request: ${qid}`);
    }
    return question;
}

async function getHit(req, res) {
    const question = getQuestion(req);
    let size = 1;
    const noHitsQuestion = _.get(req, '_settings.ES_NO_HITS_QUESTION', 'no_hits');
    if (open_es.isQuestionAllStopwords(question)) {
        qnabot.log(`Question '${question}' contains only stop words. Forcing no hits.`);
        size = 0;
    }
    let errors = [];

    const {
        ES_MINIMUM_SHOULD_MATCH,
        ES_PHRASE_BOOST,
        ES_USE_KEYWORD_FILTERS,
        ES_KEYWORD_SYNTAX_TYPES,
        ES_SYNTAX_CONFIDENCE_LIMIT,
        ES_USE_FUZZY_MATCH,
        ES_EXPAND_CONTRACTIONS,
        ALT_SEARCH_KENDRA_INDEXES,
        ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE,
        KENDRA_FAQ_INDEX,
        KENDRA_FAQ_ES_FALLBACK,
        ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE,
        RUN_LAMBDAHOOK_FROM_QUERY_STEP,
    } = req._settings;

    const query_params = {
        question,
        topic: _.get(req, 'session.topic', ''),
        from: 0,
        size,
        minimum_should_match: ES_MINIMUM_SHOULD_MATCH,
        phrase_boost: ES_PHRASE_BOOST,
        use_keyword_filters: ES_USE_KEYWORD_FILTERS,
        keyword_syntax_types: ES_KEYWORD_SYNTAX_TYPES,
        syntax_confidence_limit: ES_SYNTAX_CONFIDENCE_LIMIT,
        fuzziness: ES_USE_FUZZY_MATCH,
        es_expand_contractions: ES_EXPAND_CONTRACTIONS,
        kendra_indexes: ALT_SEARCH_KENDRA_INDEXES,
        minimum_confidence_score: ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE,
        qnaClientFilter: _.get(req, 'session.QNAClientFilter'),
        settings: req._settings,
    };

    let hit;
    [req, res, hit] = await runFirstQuery(req, query_params, KENDRA_FAQ_INDEX, res);

    // ES fallback if KendraFAQ fails
    if (!hit && KENDRA_FAQ_INDEX && KENDRA_FAQ_ES_FALLBACK) {
        hit = await opensearchFallback(req, query_params);
    }

    // Check if item contains redirects to a targeted Kendra query
    if (hit && _.get(hit, 'kendraRedirectQueryText')) {
        [req, res, hit] = await kendraRedirect(hit, req, res, ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE, query_params);
    }

    if (hit) {
        res.got_hits = 1; // response flag, used in logging / kibana
        if (!hit.debug) {
            hit.debug = [];
        }

        if (hit.type === 'text') {
            hit = copyPassageFieldToAnswerFields(hit);
            // Run any configured QA Summary options on the text passage result
            [hit, errors] = await runLlmQa(req, hit);
        }
    } else if (query_params.kendra_indexes.length != 0) {
        // If enabled, try Kendra Retrieval API
        [req, res, hit, errors] = await kendraFallback(req, hit, res);
    }

    if (!hit) {
        hit = await getNoHitsResponse(noHitsQuestion, query_params, res, req, KENDRA_FAQ_INDEX);
    }

    if (hit) {
        res = setSessionTopic(hit, res);
        // run handlebars template processing
        hit = await handlebars(req, res, hit);

        hit = encryptConditionalChainingIfSet(hit);

        // update the res object with the hit results
        res = updateResWithHit(req, res, hit);

        if (RUN_LAMBDAHOOK_FROM_QUERY_STEP) {
            [req, res, hit] = await invokeLambdaHook(hit, req, res);
        }
    }
    return [req, res, hit, errors];
}
exports.getHit = getHit;
