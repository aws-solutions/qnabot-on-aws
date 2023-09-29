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
// import from es-proxy-layer
const qnabot = require('qnabot/logging');
const qna_settings = require('qnabot/settings');

const s3 = new aws.S3();
const stride = parseInt(process.env.STRIDE);
const _ = require('lodash');
const convertxlsx = require('convert-xlsx');
const delete_existing_content = require('delete_existing_content');
const request = require('../../../../../../../../opt/lib/request.js');
const get_embeddings = require('../../../../../../../../opt/lib/embeddings.js');

async function get_settings() {
    const settings = await qna_settings.merge_default_and_custom_settings();
    qnabot.log('Merged Settings: ', settings);
    return settings;
}

async function es_bulk_load(body) {
    const es_response = await request({
        url: `https://${process.env.ES_ENDPOINT}/_bulk`,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-ndjson' },
        body,
    });
    qnabot.log('Response (first 500 chars): ', JSON.stringify(es_response, null, 2).slice(0, 500));
    return es_response;
}

async function es_store_doc(index, id, body) {
    const es_response = await request({
        url: `https://${process.env.ES_ENDPOINT}/${index}/_doc/${id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
    });
    qnabot.log('Response: ', JSON.stringify(es_response, null, 2).slice(0, 500));
    return es_response;
}

exports.step = async function (event, context, cb) {
    try {
        qnabot.log('step');
        qnabot.log('Request', JSON.stringify(event, null, 2));
        const Bucket = event.Records[0].s3.bucket.name;
        const Key = decodeURI(event.Records[0].s3.object.key);
        let progress;
        qnabot.log(Bucket, Key);
        await s3.waitFor('objectExists', {
            Bucket,
            Key,
        }).promise()
        const x = await s3.getObject({
                Bucket,
                Key,
            }).promise()
        const config = JSON.parse(x.Body.toString())
        qnabot.log('Config:', JSON.stringify(config, null, 2));
        if (config.status === 'InProgress') {
            // NOSONAR TODO - design a more robust way to identify target ES index for auto import of metrics and feedback
            // Filenames must match across:
            // aws-ai-qna-bot/templates/import/UpgradeAutoImport.js
            // aws-ai-qna-bot/templates/master/UpgradeAutoExport.js
            // and pattern in /aws-ai-qna-bot/lambda/import/index.js
            const esindex = getOsIndex(Key);
            qnabot.log('Importing to index: ', esindex);
            try {
                const result = await s3.getObject({
                    Bucket: config.bucket,
                    Key: config.key,
                    VersionId: config.version,
                    Range: `bytes=${config.start}-${config.end}`,
                }).promise()
                const settings = await get_settings();
                qnabot.log('opening file');
                let objects = [];
                try {
                    config.buffer += result.Body.toString();
                    if (config.buffer.startsWith('PK')) {
                        qnabot.log('starts with PK, must be an xlsx');
                        const questionArray = await convertxlsx.convertxlsx(result.Body);
                        qnabot.log('number of items processed: ', questionArray.length);
                        questionArray.forEach((question) => {
                            const questionStr = JSON.stringify(question);
                            qnabot.log(questionStr);
                            objects.push(questionStr);
                        });
                        config.buffer = '';
                    } else {
                        objects = config.buffer.split(/\n/);
                        JSON.parse(objects[objects.length - 1]);
                        config.buffer = '';
                    }
                } catch (e) {
                    qnabot.log("An error occured while processing question array: ", e)
                    config.buffer = objects.pop();
                }
                const { out, success, failed } = await processQuestionObjects(objects, settings, esindex, config);
                config.count = success;
                config.failed = failed;
                
                qnabot.log(result.ContentRange);
                const tmp = result.ContentRange.match(/bytes (.*)-(.*)\/(.*)/);
                progress = (parseInt(tmp[2]) + 1) / parseInt(tmp[3]);
                const ES_formatted_content = `${out.join('\n')}\n`;
                await delete_existing_content.delete_existing_content(esindex, config, ES_formatted_content) // check and delete existing content (if parameter to delete has been passed in the options {file}
                    /*
                    // Disable bulk load.. Instead save docs one at a time, for now, due to issues with k-nn index after bulk load
                    // NOSONAR TODO - revert back to bulk (more efficient) when we move to OpenSearch 2.3
                    .then(function (result) {
                        return es_bulk_load(result)
                            .then(x => {
                                config.EsErrors.push(x.errors)
                            })
                    })
                    */ 
                config.start = (config.end + 1);
                config.end = config.start + config.stride;
                config.progress = progress;
                config.time.rounds += 1;
                if (config.progress >= 1) {
                    config.status = 'Complete';
                    config.time.end = (new Date()).toISOString();
                }
                qnabot.log('EndConfig:', JSON.stringify(config, null, 2));
                await s3.putObject({
                            Bucket,
                            Key,
                            Body: JSON.stringify(config),
                        }).promise()
                cb(null);
            }
            catch(error) {
                qnabot.log("An error occured while config status was InProgress: ", error);
                config.status = 'Error';
                config.message = JSON.stringify(error);
                await s3.putObject({
                    Bucket,
                    Key,
                    Body: JSON.stringify(config),
                }).promise()
                cb(error);
            };
        }
    } catch (err) {
        qnabot.log("An error occured while getting parsing for config", err)
        cb(err)
    }
};

exports.start = async function (event, context, cb) {
    try {
        qnabot.log('starting');
        qnabot.log('Request', JSON.stringify(event, null, 2));
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURI(event.Records[0].s3.object.key);
        qnabot.log(bucket, key);
        const config = {
            stride,
            start: 0,
            end: stride,
            buffer: '',
            count: 0,
            failed: 0,
            progress: 0,
            EsErrors: [],
            time: {
                rounds: 0,
                start: (new Date()).toISOString(),
            },
            status: 'InProgress',
            bucket,
            key,
            version: event.Records[0].s3.object.versionId,
        };
        qnabot.log('Config: ', JSON.stringify(config));
        const out_key = `status/${decodeURI(event.Records[0].s3.object.key.split('/').pop())}`;
        qnabot.log(bucket, out_key);
        await s3.putObject({
            Bucket: bucket,
            Key: out_key,
            Body: JSON.stringify(config),
        }).promise()
        cb(null)
    } catch (x) {
        qnabot.log("An error occured in start function: ", x)
        cb(JSON.stringify({
            type: '[InternalServiceError]',
            data: x,
        }))
    }
};
async function processQuestionObjects(objects, settings, esindex, config) {
    const out = [];
    let success = config.count || 0;
    let failed = config.failed || 0;
    for (const x of objects) {
        try {
            let obj = JSON.parse(x);
            const timestamp = _.get(obj, 'datetime', '');
            let docid;
            if (timestamp === '') {
                // only metrics and feedback items have datetime field.. This must be a qna, quiz, or text item.
                obj.type = obj.type || 'qna';
                obj = await handleQuestionByType(obj, settings);
                docid = obj._id || obj.qid;
            } else {
                docid = obj._id || `${obj.qid}_upgrade_restore_${timestamp}`;
                const sessionAttrs = stringifySessionAttributes(obj);
            }
            delete obj._id;
            out.push(JSON.stringify({
                index: {
                    _index: esindex,
                    _id: docid,
                },
            }));
            success += 1;
            out.push(JSON.stringify(obj));

            // Save docs one at a time, for now, due to issues with k-nn index after bulk load
            // NOSONAR TODO - revert back to bulk (more efficient) when we move to OpenSearch 2.3
            await es_store_doc(esindex, docid, obj);
        } catch (e) {
            failed += 1;
            qnabot.log('Failed to Parse:', e, x);
        }
    }
    return { out, success, failed };
}

async function handleQuestionByType(obj, settings) {
    if (obj.type != 'slottype' && obj.type != 'text') {
        obj.q = obj.q.map((x) => {
            x = x.replace(/\\*"/g, '');
            return x;
        });
    }
    if (obj.type === 'qna') {
        try {
            obj = await handleEmbeddings(obj, settings);
        } catch (err) {
            qnabot.log('skipping question due to exception', err);
        }
        delete obj.q;
    } else if (obj.type === 'text') {
        // passage field embeddings
        const { passage } = obj;
        if (passage) {
            obj.passage_vector = await get_embeddings('a', passage, settings);
        }
    }
    return obj;
}

async function handleEmbeddings(obj, settings) {
    // question embeddings
    obj.questions = await Promise.all(obj.q.map(async (x) => {
        const q_embeddings = await get_embeddings('q', x, settings);
        if (q_embeddings) {
            return {
                q: x,
                q_vector: q_embeddings,
            };
        }
        return {
            q: x,
        };
    }));

    // answer embeddings
    const answer = obj.a;
    if (answer) {
        obj.a_vector = await get_embeddings('a', answer, settings);
    }
    obj.quniqueterms = obj.q.join(' ');
    return obj;
}

function stringifySessionAttributes(obj) {
    const sessionAttrs = _.get(obj, 'entireResponse.session', {});
    for (const key of Object.keys(sessionAttrs)) {
        if (typeof sessionAttrs[key] !== 'string') {
            sessionAttrs[key] = JSON.stringify(sessionAttrs[key]);
        }
    }
    return sessionAttrs;
}

function getOsIndex(Key) {
    let esindex = process.env.ES_INDEX;
    if (Key.match(/.*ExportAll_QnABot_.*_metrics\.json/)) {
        esindex = process.env.ES_METRICSINDEX;
    } else if (Key.match(/.*ExportAll_QnABot_.*_feedback\.json/)) {
        esindex = process.env.ES_FEEDBACKINDEX;
    }
    return esindex;
}