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
const aws = require('aws-sdk');

aws.config.region = process.env.AWS_REGION;
const _ = require('lodash');
const load = require('./load');

module.exports = async function (config) {
    try {
        console.log('Starting');
        config.status = 'InProgress';
        config.startDate = (new Date()).toString();
        config.parts = [];

        return await load(config, {
            endpoint: process.env.ES_ENDPOINT,
            method: 'POST',
            path: `${config.index}/_search?scroll=1m`,
            body: query(config.filter),
        });
    } catch (error) {
        console.error('An error occurred while starting: ', error);
        throw error;
    }
};
function query(filter) {
    return {
        size: 1000,
        _source: {
            exclude: ['questions.q_vector', 'a_vector'],
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
