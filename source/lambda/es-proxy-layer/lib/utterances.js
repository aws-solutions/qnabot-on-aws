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
const region = process.env.AWS_REGION || 'us-east-1';
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const s3 = new S3Client(customSdkConfig('C021', { region, logger: console  }));
const qnabot = require('qnabot/logging');
const { con } = require('/opt/opensearch-client/connection');

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
                const scrollId = results.body._scroll_id;
                const out = results.body.hits.hits;
                return new Promise((resolve, reject) => {
                    const next = function () {
                        es.scroll({
                            scrollId,
                            scroll: '10s',
                        })
                            .then((scrollResults) => {
                                const { hits } = scrollResults.body.hits;
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

        const s3Utterances = s3.send(new GetObjectCommand({
            Bucket: process.env.UTTERANCE_BUCKET,
            Key: process.env.UTTERANCE_KEY,
        }))
            .then(async (result) => {
                const response = await result.Body.transformToString();
                qnabot.log("S3 utterances response: ", response);
                return JSON.parse(response);
            });

        return Promise.all([esUtterances, s3Utterances])
            .then(([esResults, s3Results]) => ({ utterances: _.compact(_.uniq(_.flatten([esResults, s3Results]))) }));
    } catch (e) {
        qnabot.log(e);
        callback(e);
    }
};