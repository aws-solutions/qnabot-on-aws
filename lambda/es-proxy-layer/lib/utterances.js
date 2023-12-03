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
const Promise = require('bluebird');
const aws = require('aws-sdk');
aws.config.region = process.env.AWS_REGION || 'us-east-1';
aws.config.signatureVersion = 'v4';
aws.config.logger = console;
const s3 = new aws.S3();
const myCredentials = new aws.EnvironmentCredentials('AWS');
const qnabot = require('qnabot/logging');

const con = _.memoize((esAddress) => {
    const opts = {
        requestTimeout: 10 * 1000,
        pingTimeout: 10 * 1000,
        hosts: esAddress,
        connectionClass: require('http-aws-es'),
        defer() {
            return Promise.defer();
        },
        amazonES: {
            region: process.env.AWS_REGION,
            credentials: myCredentials,
        },
    };
    const es = require('elasticsearch').Client(opts);
    return es;
});

module.exports = async function (event, context, callback) {
    try {
        const es = con(process.env.ES_ADDRESS);
        const esUtterances = es.search({
            index: process.env.ES_INDEX,
            scroll: '10s',
            body: {
                query: { match_all: {} },
            },
        })
        .then((results) => {
            const scroll_id = results._scroll_id;
            const out = results.hits.hits;
            return new Promise((resolve, reject) => {
                const next = function () {
                    es.scroll({
                        scrollId: scroll_id,
                        scroll: '10s',
                    })
                        .then((scroll_results) => {
                            const { hits } = scroll_results.hits;
                            hits.forEach((x) => out.push(x));
                            hits.length ? next() : resolve(out);
                        })
                        .catch(reject);
                };
                next();
            });
        })
        .then((result) => _.compact(_.uniq(_.flatten(result
            .map((qa) => (qa._source.questions ? qa._source.questions.map((y) => y.q) : []))))));

        const s3Utterances = s3.getObject({
            Bucket: process.env.UTTERANCE_BUCKET,
            Key: process.env.UTTERANCE_KEY,
        }).promise()
            .then((x) => {
                qnabot.log(x);
                return JSON.parse(x.Body.toString());
            });

        return Promise.all([esUtterances, s3Utterances])
            .then(([esResults, s3Results]) => ({ utterances: _.compact(_.uniq(_.flatten([esResults, s3Results]))) }));
    } catch (e) {
        qnabot.log(e);
        callback(e);
    }
};
