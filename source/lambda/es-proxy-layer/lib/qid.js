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
    let query;
    qnabot.log('Qid', event.qid);
    if (event.type == 'next') {
        query = bodybuilder()
            .orFilter('term', 'next.keyword', event.qid)
            .from(0)
            .size(1)
            .build();
    } else {
        query = bodybuilder()
            .orQuery('match', 'qid', event.qid)
            .from(0)
            .size(1)
            .build();
    }

    qnabot.debug('OpenSearch Query', JSON.stringify(query, null, 2));
    return request({
        url: url.resolve(`https://${process.env.ES_ADDRESS}`, `/${process.env.ES_INDEX}/_search`),
        method: 'GET',
        body: query,
    })
        .then((result) => {
            qnabot.log(`ES result:${JSON.stringify(result, null, 2)}`);
            callback(null, _.get(result, 'hits.hits[0]._source', {}));
        })
        .catch(callback);
};
