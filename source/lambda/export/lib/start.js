/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const load = require('./load');

module.exports = function (config) {
    console.log('Starting');
    config.status = 'InProgress';
    config.startDate = (new Date()).toString();
    config.parts = [];
    config.bucket = process.env.OUTPUT_S3_BUCKET;

    return load(config, {
        endpoint: process.env.ES_ENDPOINT,
        method: 'POST',
        path: `${config.index}/_search?scroll=1m`,
        body: query(config.filter),
    });
};
function query(filter) {
    return {
        size: 1000,
        _source: {
            exclude: ['questions.q_vector', 'a_vector', 'passage_vector'],
        },
        query: {
            bool: _.pickBy({
                must: { match_all: {} },
                filter: filter ? {
                    regexp: {
                        qid: filter,
                    },
                } : null,
            }),
        },
    };
}
