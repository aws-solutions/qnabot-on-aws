/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const region = process.env.AWS_REGION;
const customSdkConfig = require('sdk-config/customSdkConfig');

const s3 = new S3Client(customSdkConfig('C011', { region }));
const lambda = new LambdaClient(customSdkConfig('C011', { region }));
const _ = require('lodash');

module.exports=async function(config,body){
    const invokeCmd = new InvokeCommand({
        FunctionName:process.env.ES_PROXY,
        Payload:JSON.stringify(body)
    });
    const res = await lambda.send(invokeCmd);
    const payload = Buffer.from(res.Payload).toString();
    const result = JSON.parse(payload)
    console.log(result)

    config.scroll_id=result._scroll_id 
    config.status='InProgress'

    const documents = _.get(result, 'hits.hits', [])
    if(documents.length){
        const body = documents.map(x => {
            const out = x._source;
            // remap nested questions array for JSON file backward compatability
            if (out.type === 'qna' && _.has(out, 'questions')) {
                out.q = out.questions.map((y) => y.q);
            }
            // if item has a qid, we don;t need the _id field, so we can delete it.
            if (!_.has(out, 'qid')) {
                out._id = x._id;
            }
            // delete fields that we don't need in the exported JSON
            delete out.questions;
            delete out.quniqueterms;
            return JSON.stringify(out);
        }).join('\n')

        const key=`${config.tmp}/${config.parts.length+1}`
        const params = {
            Body: body,
            Bucket: config.bucket,
            Key: key,
        };
        const putObjCmd = new PutObjectCommand(params);
        const s3Respose = await s3.send(putObjCmd);
        config.parts.push({
            version:s3Respose.VersionId,
            key:key
        })
    }else{
        config.status='Join'
    }
}
