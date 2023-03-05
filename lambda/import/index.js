const Promise = require('bluebird');
const aws = require("aws-sdk");
aws.config.setPromisesDependency(Promise);
aws.config.region = process.env.AWS_REGION;
// import from es-proxy-layer
const get_embeddings = require('/opt/lib/embeddings.js');
const request=require('/opt/lib/request.js');
const qnabot = require("qnabot/logging")
const qna_settings = require("qnabot/settings")

const s3 = new aws.S3();
const stride = parseInt(process.env.STRIDE);
const _ = require('lodash');
const convertxlsx = require('convert-xlsx');
const delete_existing_content = require('delete_existing_content');

async function get_settings() {
    let settings = await qna_settings.merge_default_and_custom_settings();
    qnabot.log("Merged Settings: ", settings);
    return settings;
}

async function es_bulk_load(body) {
    const es_response = await request({
        url:"https://" + process.env.ES_ENDPOINT + "/_bulk",
        method:"POST",
        headers:{'Content-Type': 'application/x-ndjson'},
        body:body,
    });
    qnabot.log("Response (first 500 chars): ", JSON.stringify(es_response,null,2).slice(0,500));
    return es_response;
}

async function es_store_doc(index, id, body) {
    const es_response = await request({
        url:`https://${process.env.ES_ENDPOINT}/${index}/_doc/${id}`, 
        method:"PUT",
        headers:{'Content-Type': 'application/json'},
        body:body,
    });
    qnabot.log("Response: ", JSON.stringify(es_response,null,2).slice(0,500));
    return es_response;
}

exports.step = function (event, context, cb) {
    qnabot.log("step")
    qnabot.log("Request", JSON.stringify(event, null, 2))
    let Bucket = event.Records[0].s3.bucket.name
    let Key = decodeURI(event.Records[0].s3.object.key)
    let progress
    qnabot.log(Bucket, Key);
    s3.waitFor('objectExists', {
            Bucket,
            Key
        }).promise()
        .then(() => s3.getObject({
            Bucket,
            Key
        }).promise())
        .then(x => JSON.parse(x.Body.toString()))
        .then(function (config) {
            qnabot.log("Config:", JSON.stringify(config, null, 2));
            if (config.status === "InProgress") {
                // TODO - design a more robust way to identify target ES index for auto import of metrics and feedback
                // Filenames must match across:
                // aws-ai-qna-bot/templates/import/UpgradeAutoImport.js
                // aws-ai-qna-bot/templates/master/UpgradeAutoExport.js
                // and pattern in /aws-ai-qna-bot/lambda/import/index.js
                let esindex = process.env.ES_INDEX;
                if (Key.match(/.*ExportAll_QnABot_.*_metrics\.json/)) {
                    esindex = process.env.ES_METRICSINDEX;
                } else if (Key.match(/.*ExportAll_QnABot_.*_feedback\.json/)) {
                    esindex = process.env.ES_FEEDBACKINDEX;
                }
                qnabot.log("Importing to index: ", esindex);
                return s3.getObject({
                        Bucket: config.bucket,
                        Key: config.key,
                        VersionId: config.version,
                        Range: `bytes=${config.start}-${config.end}`
                    }).promise()
                    .then(async function (result) {
                        const settings = await get_settings();
                        qnabot.log('opening file')
                        let objects = []
                        try {
                            config.buffer += result.Body.toString()
                            if(config.buffer.startsWith('PK')) {
                                qnabot.log('starts with PK, must be an xlsx')
                                let questionArray = convertxlsx.convertxlsx(result.Body)
                                qnabot.log('number of items processed: ', questionArray.length)
                                questionArray.forEach(question => {
                                    let questionStr = JSON.stringify(question)
                                    qnabot.log(questionStr)
                                    objects.push(questionStr)
                                })
                                config.buffer = ""
                            } else {
                                objects = config.buffer.split(/\n/)
                                JSON.parse(objects[objects.length - 1])
                                config.buffer = ""
                            }
                        } catch (e) {
                            config.buffer=objects.pop()
                        }
                        let out = []
                        for (const x of objects) {
                            try {
                                let obj = JSON.parse(x)
                                let timestamp = _.get(obj, 'datetime', "");
                                let docid;
                                if (timestamp === "") {
                                    // only metrics and feedback items have datetime field.. This must be a qna item.
                                    obj.type = obj.type || 'qna'
                                    if(obj.type != 'slottype' && obj.type != 'text') {
                                        obj.q = obj.q.map(x => {
                                            x = x.replace(/\\*"/g, '');
                                            return x
                                        });
                                    }
                                    if (obj.type === 'qna') {
                                        try {
                                            // question embeddings
                                            obj.questions = await Promise.all(obj.q.map(async x => {
                                                const q_embeddings = await get_embeddings("q", x, settings);
                                                if (q_embeddings) {
                                                    return {
                                                        q: x,
                                                        q_vector: q_embeddings,
                                                    }
                                                } else {
                                                    return {
                                                        q: x
                                                    }
                                                }
                                            }));
                                            // answer embeddings
                                            let answer = obj.a;
                                            if (answer) {
                                                obj.a_vector = await get_embeddings("a", answer, settings);
                                            }
                                            obj.quniqueterms = obj.q.join(" ");
                                        } catch (err) {
                                            qnabot.log("skipping question due to exception", err);
                                        }
                                        delete obj.q
                                    }
                                    docid = obj._id || obj.qid;
                                } else {
                                    docid = obj._id || obj.qid + "_upgrade_restore_" + timestamp;
                                    // Stringify session attributes
                                    let sessionAttrs = _.get(obj, "entireResponse.session", {});
                                    for (let key of Object.keys(sessionAttrs)) {
                                        if (typeof sessionAttrs[key] != 'string') {
                                            sessionAttrs[key] = JSON.stringify(sessionAttrs[key]);
                                        }
                                    }
                                }
                                delete obj._id;
                                out.push(JSON.stringify({
                                    index: {
                                        "_index": esindex,
                                        "_id": docid
                                    }
                                }))
                                config.count += 1
                                out.push(JSON.stringify(obj))
                                
                                // Save docs one at a time, for now, due to issues with k-nn index after bulk load
                                // TODO - revert back to bulk (more efficient) when we move to OpenSearch 2.3
                                await es_store_doc(esindex, docid, obj);

                            } catch (e) {
                                config.failed += 1
                                qnabot.log("Failed to Parse:", e, x)
                            }
                        }
                        qnabot.log(result.ContentRange)
                        let tmp = result.ContentRange.match(/bytes (.*)-(.*)\/(.*)/)
                        progress = (parseInt(tmp[2]) + 1) / parseInt(tmp[3])
                        return out.join('\n') + '\n'
                    })
                    .then ((ES_formatted_content)=>delete_existing_content.delete_existing_content (esindex, config, ES_formatted_content))   //check and delete existing content (if parameter to delete has been passed in the options {file}
                    /*
                    // Disable bulk load.. Instead save docs one at a time, for now, due to issues with k-nn index after bulk load
                    // TODO - revert back to bulk (more efficient) when we move to OpenSearch 2.3
                    .then(function (result) {
                        return es_bulk_load(result)
                            .then(x => {
                                config.EsErrors.push(x.errors)
                            })
                    })
                    */
                    .then(() => {
                        config.start = (config.end + 1)
                        config.end = config.start + config.stride
                        config.progress = progress
                        config.time.rounds += 1

                        if (config.progress >= 1) {
                            config.status = "Complete"
                            config.time.end = (new Date()).toISOString()
                        }

                        qnabot.log("EndConfig:", JSON.stringify(config, null, 2))
                        return s3.putObject({
                                Bucket: Bucket,
                                Key: Key,
                                Body: JSON.stringify(config)
                            }).promise()
                            .then(result => cb(null))
                    })
                    .catch(error => {
                        qnabot.log(error)
                        config.status = "Error"
                        config.message = JSON.stringify(error)
                        return s3.putObject({
                                Bucket: Bucket,
                                Key: Key,
                                Body: JSON.stringify(config)
                            }).promise()
                            .then(() => cb(error))
                    })
            }
        })
        .catch(cb)
}

exports.start = function (event, context, cb) {
    qnabot.log("starting")
    qnabot.log("Request", JSON.stringify(event, null, 2))
    let bucket = event.Records[0].s3.bucket.name
    let key = decodeURI(event.Records[0].s3.object.key)
    qnabot.log(bucket, key)
    let config = {
        stride,
        start: 0,
        end: stride,
        buffer: "",
        count: 0,
        failed: 0,
        progress: 0,
        EsErrors: [],
        time: {
            rounds: 0,
            start: (new Date()).toISOString()
        },
        status: "InProgress",
        bucket,
        key,
        version: event.Records[0].s3.object.versionId,
    }
    qnabot.log("Config: ", JSON.stringify(config));
    let out_key = "status/" + decodeURI(event.Records[0].s3.object.key.split('/').pop())
    qnabot.log(bucket, out_key)
    s3.putObject({
            Bucket: bucket,
            Key: out_key,
            Body: JSON.stringify(config)
        }).promise()
        .then(x => cb(null))
        .catch(x => cb(JSON.stringify({
            type: "[InternalServiceError]",
            data: x
        })))
}