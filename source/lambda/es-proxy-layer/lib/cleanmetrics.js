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

module.exports = async function (event, context) {
    await Promise.all([
        sendDelete('metrics', process.env.METRICS_DELETE_RANGE_MINUTES),
        sendDelete('feedback', process.env.FEEDBACK_DELETE_RANGE_MINUTES)
    ]);
    return event;
};

async function sendDelete(indexName, timeBack) {
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
    try {
        const result = await request({
            url: url.resolve(`https://${process.env.ES_ADDRESS}`, `/${process.env.ES_INDEX}-${indexName}/_delete_by_query`),
            method: 'POST',
            body: query,
        });
        qnabot.log(`ES result:${JSON.stringify(result, null, 2)}`);
        return _.get(result, 'hits.hits[0]._source', {});
    } catch (error) {
        qnabot.error('Error in sendDelete:', error);
        throw error;
    }
}
