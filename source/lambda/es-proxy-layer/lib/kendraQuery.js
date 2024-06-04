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

/**
 * optional environment variables - These are not used defined during setup of this function in QnABot but are
 * useful for testing if defined.
 *
 * REGION - optional AWS region to target
 *
 */

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const open_es = require('./es_query');
const { queryKendra } = require('./kendraClient');

function allow_kendra_result(kendra_result, minimum_score) {
    if (!confidence_filter(minimum_score, kendra_result)) {
        qnabot.log(`Result removed: ScoreConfidence [${_.get(kendra_result, 'ScoreAttributes.ScoreConfidence')}] below threshold [${minimum_score}] - Passage: ${_.get(kendra_result, 'DocumentExcerpt.Text')}`);
        return false;
    }
    qnabot.log(`Result allowed: Type [${kendra_result.Type}], ScoreConfidence [${_.get(kendra_result, 'ScoreAttributes.ScoreConfidence')}] - Passage: ${_.get(kendra_result, 'DocumentExcerpt.Text')}`);
    return true;
}

function confidence_filter(minimum_score, kendra_result) {
    let confidences = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
    const index = confidences.findIndex((i) => i == minimum_score.toUpperCase());
    if (index === -1) {
        qnabot.log('Warning: ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE should be one of \'VERY_HIGH\'|\'HIGH\'|\'MEDIUM\'|\'LOW\'');
        return true;
    }
    confidences = confidences.slice(index);
    const found = confidences.find((element) => element == _.get(kendra_result, 'ScoreAttributes.ScoreConfidence')) != undefined;
    return found;
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function processKendraResults(resArray, request_params) {
    /* default message text - can be overridden using QnABot SSM Parameter Store Custom Property */
    let foundAnswerCount = 0;
    let kendraQueryId;
    let kendraIndexId;
    let kendraResultId;
    const jsonStruct = [];

    // note that this outside for loop will only execute once (one FAQ index) but the structure was kept due to its elegance
    await asyncForEach(resArray, async (res) => {
        if (!res?.ResultItems?.length > 0) {
            return;
        }

        let element;
        for (const resultItem of res.ResultItems) {
            element = resultItem;

            /* Note - only FAQ format will be provided back to the requester */
            if (faqResultAllowed(element, request_params, foundAnswerCount)) {
                if (!open_es.hasJsonStructure(element.DocumentURI)) break;

                const hit = await getHitFromOpensearch(element, request_params);
                if (!hit) {
                    qnabot.log(`WARNING: An answer was found in Kendrs FAQ, but a corresponding answer was not found in OpenSearch for ${hit}`);
                } else if (_.get(hit, 'QNAClientFilter')) {
                    qnabot.log('Found an answer with a clientFilterValue set...skipping');
                } else {
                    qnabot.log(`hit is ${JSON.stringify(hit)}`);
                    jsonStruct.push(hit);

                    kendraQueryId = res.QueryId; // store off the QueryId to use as a session attribute for feedback
                    kendraIndexId = res.originalKendraIndexId; // store off the Kendra IndexId to use as a session attribute for feedback
                    kendraResultId = element.Id; // store off resultId to use as a session attribute for feedback
                    foundAnswerCount += 1;
                }
            }
        }
    });
    return {
        foundAnswerCount, jsonStruct, kendraQueryId, kendraIndexId, kendraResultId,
    };
}

function faqResultAllowed(element, request_params, foundAnswerCount) {
    return allow_kendra_result(element, request_params.minimum_score) && element.Type === 'QUESTION_ANSWER' && foundAnswerCount < request_params.size && element.AdditionalAttributes?.length > 1;
}

async function getHitFromOpensearch(element, request_params) {
    let hit = JSON.parse(element.DocumentURI);
    if (_.get(hit, '_source_qid')) {
        const qid = hit._source_qid;
        // FAQ only references the QID but doesn't contain the full docunment.. retrieve it from ES
        qnabot.log('Kendra matched qid: ', qid, '. Retrieving full document from OpenSearch.');
        const es_response = await open_es.run_qid_query_es(request_params, qid);
        qnabot.log('Qid document from Kendra: ', JSON.stringify(hit));
        hit = _.get(es_response, 'hits.hits[0]._source'); // NOSONAR TODO: fix if null -- test from content designer
    }
    return hit;
}

/** Function that processes kendra requests and handles response. Decides whether to handle SNS
 * events or Lambda Hook events from QnABot.
 * @param request - request parameters object
//  * @param event - input event passed to the Lambda Handler
//  * @param context - input context passed to the Lambda Handler
 * @returns {Promise<*>} - returns the response in event.res
 */
async function routeKendraRequest(request_params) {
    const { maxRetries, retryDelay } = request_params;

    const promises = [];
    const resArray = [];
    let kendraIndexes;
    const kendraFaqIndex = request_params.kendra_faq_index;
    if (kendraFaqIndex) {
        kendraIndexes = [kendraFaqIndex];
    } else {
        throw new Error(`Undefined KendraFAQIndex: ${kendraFaqIndex}`);
    }
    // Iterate through this area and perform queries against Kendra.
    kendraIndexes.forEach((index) => {
        let params = {
            IndexId: index,
            QueryText: request_params.question,
            AttributeFilter: {
                EqualsTo: {
                    Key: "_language_code",
                    Value: {
                        StringValue: request_params.language,
                      },
                },
            },
        };
        const p = queryKendra(resArray, [], maxRetries, retryDelay, request_params.usrContext , params);
        promises.push(p);
    });
    await Promise.all(promises);

    const {
        foundAnswerCount, jsonStruct, kendraQueryId, kendraIndexId, kendraResultId,
    } = await processKendraResults(resArray, request_params);

    // return query response structure to make Kendra results look like ES results so we don't have to change the UI
    const hits_struct = {
        // "took": 104,
        timed_out: false,
        hits: {
            total: {
                value: foundAnswerCount, // if no answers found, total hits # is 0 and hits list is empty
                relation: 'eq',
            },
            max_score: jsonStruct.length,
            hits: [],
        },
    };
    if (kendraQueryId) {
        hits_struct.kendra_context = {
            kendraQueryId,
            kendraIndexId,
            kendraResultId,
            kendraResponsibleQid: 'KendraFAQ',
        };
    }

    let num = jsonStruct.length;
    if (request_params.size) {
        num = Math.min(num, request_params.size);
    }
    for (let j = 0; j < num; j++) {
        const faq_struct = jsonStruct[j];

        const ans = {
            _index: request_params.kendra_faq_index,
            _type: '_faq',
            _id: faq_struct.qid,
            _score: jsonStruct.length - j, // score is inverse ranking of returned results
            _source: faq_struct,
        };
        hits_struct.hits.hits.push(ans);
    }

    // cache kendra results to optimize fallback engine
    if (request_params.same_index && resArray.length > 0) {
        hits_struct.kendraResultsCached = resArray[0];
    }

    qnabot.debug(`RETURN: ${JSON.stringify(hits_struct)}`);
    return hits_struct;
}

exports.handler = async (request_params) => {
    qnabot.log(`Kendra request params: ${JSON.stringify(request_params)}`);
    return routeKendraRequest(request_params);
};
