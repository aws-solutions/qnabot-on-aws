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

const s3 = new aws.S3();
const lambda = new aws.Lambda();
const _ = require('lodash');

module.exports=async function(config,body){
    const res = await lambda.invoke({
        FunctionName:process.env.ES_PROXY,
        Payload:JSON.stringify(body)
    }).promise()

    const result = JSON.parse(res.Payload)
    console.log(result)

    config.scroll_id=result._scroll_id 
    config.status='InProgress'

    const documents=_.get(result,'hits.hits',[])
    if(documents.length){
        const body=documents.map(x=>{
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

        const s3Respose = await s3.putObject({
            Body:body,
            Bucket:config.bucket,
            Key:key
        }).promise()
        
        config.parts.push({
            version:s3Respose.VersionId,
            key:key
        })
    }else{
        config.status='Join'
    }
}
