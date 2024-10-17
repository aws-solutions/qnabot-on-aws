/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
