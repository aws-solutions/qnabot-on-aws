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

const Url = require('url');
const _ = require('lodash');
const qnabot = require('qnabot/logging');
const qna_settings = require('qnabot/settings');
const request = require('./request');
const build_es_query = require('./esbodybuilder');
const hits_topic_tiebreaker = require('./hits_topic_tiebreaker');
const kendra = require('./kendraQuery');
const open_es = require('./es_query');
const get_embeddings = require('./embeddings');

async function get_settings() {
    const settings = await qna_settings.merge_default_and_custom_settings();
    qnabot.log('Merged Settings: ', settings);
    return settings;
}

// add embeddings for each QID in an add or modify item PUT query
async function build_additem_embeddings(event, settings) {
    if (!settings.EMBEDDINGS_ENABLE) {
        console.log('EMBEDDINGS_ENABLE is false - query not modified');
        return event.body;
    }
    // question embeddings
    const questions = _.get(event, 'body.questions', []);
    const questions_with_embeddings = await Promise.all(questions.map(async (x) => {
        const q_embeddings = await get_embeddings('q', x.q, settings);
        return {
            q: x.q,
            q_vector: q_embeddings,
        };
    }));
    event.body.questions = questions_with_embeddings;
    // answer embeddings
    const answer = _.get(event, 'body.a');
    if (answer) {
        event.body.a_vector = await get_embeddings('a', answer, settings);
    }
    // text item passage embeddings
    const passage = _.get(event, 'body.passage');
    if (passage) {
        event.body.passage_vector = await get_embeddings('a', passage, settings);
    }
    return event.body;
}

async function get_es_query(event, settings) {
    const question = _.get(event, 'question', '');
    let size = _.get(event, 'size', 1);
    if (question.length > 0) {
        if (open_es.isQuestionAllStopwords(question)) {
            qnabot.log(`Question '${question}' contains only stop words. Forcing no hits.`);
            size = 0;
        }
        const query_params = {
            question,
            topic: _.get(event, 'topic', ''),
            from: _.get(event, 'from', 0),
            size,
            minimum_should_match: _.get(settings, 'ES_MINIMUM_SHOULD_MATCH'),
            phrase_boost: _.get(settings, 'ES_PHRASE_BOOST'),
            use_keyword_filters: _.get(settings, 'ES_USE_KEYWORD_FILTERS'),
            keyword_syntax_types: _.get(settings, 'ES_KEYWORD_SYNTAX_TYPES'),
            syntax_confidence_limit: _.get(settings, 'ES_SYNTAX_CONFIDENCE_LIMIT'),
            fuzziness: _.get(settings, 'ES_USE_FUZZY_MATCH'),
            es_expand_contractions: _.get(settings, 'ES_EXPAND_CONTRACTIONS'),
            qnaClientFilter: _.get(event, 'client_filter', ''),
            score_answer: _.get(event, 'score_answer', 'false') === 'true',
            score_text_passage: _.get(event, 'score_text_passage', 'false') === 'true',
            settings,
            locale: _.get(event, '_locale.localeIdentified'),
            translation: _.get(event, '_translation.QuestionInBackupLanguage'),
        };
        return build_es_query(query_params);
    }
    if (_.get(event, 'method', '') === 'PUT') {
        // add or modify item query - add embeddings for questions list, if enabled
        const embeddings = await build_additem_embeddings(event, settings);
        return embeddings;
    }
    // use query as-is
    return Promise.resolve(event.body);
}

async function run_query_es(event, settings) {
    const es_query = await get_es_query(event, settings);
    const es_response = await request({
        url: Url.resolve(`https://${event.endpoint}`, event.path),
        method: event.method,
        headers: event.headers,
        body: es_query,
    });
    if (_.get(es_response, 'hits.max_score') == 0) {
        qnabot.log('Max score is zero - no valid results');
        es_response.hits.hits = [];
    }
    // apply topic tiebreaker to any equally ranked hits in a question response
    const question = _.get(event, 'question', '');
    if (question.length > 0 && es_response.hits.hits && es_response.hits.hits.length) {
        const newhits = hits_topic_tiebreaker(event.topic, es_response.hits.hits);
        es_response.hits.hits = newhits;
    }
    return es_response;
}

async function run_query_kendra(event, kendra_index) {
    qnabot.log(`Kendra FAQ Query index:${kendra_index}`);
    qnabot.log(event);
    const request_params = {
        kendra_faq_index: kendra_index,
        question: event.question,
        size: 10, // limit kendra hits to 10 max to avoid pagination issues
        es_address: event.endpoint,
        es_path: event.path,
        minimum_score: event.minimum_score,
    };
    const kendra_response = await kendra.handler(request_params);
    return kendra_response;
}

module.exports = async (event, context, callback) => {
    const settings = await get_settings();
    qna_settings.set_environment_variables(settings);
    qnabot.log('Received event:', JSON.stringify(event, null, 2));

    const kendra_index = _.get(settings, 'KENDRA_FAQ_INDEX');
    event.minimum_score = _.get(settings, 'ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE', 'MEDIUM');
    const question = _.get(event, 'question', '');
    const topic = _.get(event, 'topic', '');

    const req = {
        question,
    };

    const params = {
        topic,
        kendraIndex: kendra_index,
        question,
        qnaClientFilter: _.get(event, 'client_filter', ''),
        score_answer: (_.get(event, 'score_answer', 'false') === 'true'),
        score_text_passage: _.get(event, 'score_text_passage', 'false') === 'true',
    };
    let response;
    const okKendraQuery = !(await open_es.isESonly(req, params));
    if (okKendraQuery) {
        response = await run_query_kendra(event, kendra_index);
        // ES fallback if KendraFAQ fails
        const hit = _.get(response, 'hits.hits[0]._source');
        if (!hit && _.get(settings, 'KENDRA_FAQ_ES_FALLBACK', false)) {
            qnabot.log('ES Fallback');
            response = await run_query_es(event, settings);
        }
    } else {
        response = await run_query_es(event, settings);
    }
    qnabot.log('Query response: ', JSON.stringify(response, null, 2));
    return callback(null, response);
};
