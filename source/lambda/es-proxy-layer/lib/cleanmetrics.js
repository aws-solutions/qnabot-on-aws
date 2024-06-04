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

// start connection
const url = require('url');
const bodybuilder = require('bodybuilder');
const _ = require('lodash');

const qnabot = require('qnabot/logging');
const request = require('./request');

module.exports = function (event, context, callback) {
    sendDelete('metrics', process.env.METRICS_DELETE_RANGE_MINUTES, callback);
    sendDelete('feedback', process.env.FEEDBACK_DELETE_RANGE_MINUTES, callback);
    return event;
};

function sendDelete(indexName, timeBack, callback) {
    const query = bodybuilder()
        .query(
            'range',
            'datetime',
            {
                lt: `now-${timeBack}m`,
            },
        )
        .build();
    qnabot.debug('OpenSearch Query', JSON.stringify(query, null, 2));
    qnabot.log('Got Here cleanmetrics');
    return request({
        url: url.resolve(`https://${process.env.ES_ADDRESS}`, `/${process.env.ES_INDEX}-${indexName}/_delete_by_query`),
        method: 'POST',
        body: query,
    })
        .then((result) => {
            qnabot.log(`ES result:${JSON.stringify(result, null, 2)}`);
            callback(null, _.get(result, 'hits.hits[0]._source', {}));
        })
        .catch(callback);
}
