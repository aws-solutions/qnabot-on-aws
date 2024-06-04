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

const { con } = require('/opt/opensearch-client/connection');
const _ = require('lodash');

module.exports = async function (params) {
    const es = con(process.env.ADDRESS);
    const results = await es.search({
        index: process.env.INDEX,
        scroll: '10s',
        body: {
            _source: {
                exclude: ['questions.q_vector', 'a_vector'],
            },
            query: { match_all: {} },
        },
    })
    const scrollId = results.body._scroll_id;
    const result = results.body.hits.hits;
    while (true) {
        const scrollResults = await es.scroll({
            scrollId,
            scroll: '10s',
        })
        const { hits } = scrollResults.body.hits;
        hits.forEach((x) => result.push(x));
        if (!hits.length) break
    }
    const esUtterances = _.compact(_.uniq(_.flatten(result.map((qa) => ({
            qid: qa._source.qid,
            type: qa._source.type,
            qna: qa._source.type === 'qna' ? {
                enableQidIntent: _.get(qa._source, 'enableQidIntent', false),
                q: _.get(qa._source, 'questions', []).map((y) => y.q),
                slots: _.get(qa._source, 'slots', []),
            } : {},
            slotType: qa._source.type === 'slottype' ? {
                descr: _.get(qa._source, 'descr', ''),
                resolutionStrategyRestrict: _.get(qa._source, 'resolutionStrategyRestrict', false),
                slotTypeValues: _.get(qa._source, 'slotTypeValues', []),
                useForCustomVocabulary: _.get(qa._source, 'useForCustomVocabulary', false),
            } : {},
        })))));
    
    const utterances = _.compact(_.uniq(_.flatten(esUtterances)))
    return utterances
};
