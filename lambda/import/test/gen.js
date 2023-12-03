#! /bin/env node
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

const config=require('../../../config.json')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region

const faker=require('faker').lorem
const range=require('range').range

const outputs=require('../../../bin/exports')
const aws=require("aws-sdk")
const s3=new aws.S3({
    region:config.region
})

const count=10000
const data=range(0,count).map(qna).join('\n')

module.exports=async function(){
    const outputResults= await outputs('dev/bucket')
    const s3response = await s3.putObject({
        Bucket:outputResults.Bucket,
        Key:"import/bulk-test",
        Body:data
    }).promise()
    return s3response
}

function qna(index){
    return JSON.stringify({
        qid: 'bulk-test.' + index,
        q: range(0, 1).map((x) => faker.sentence()),
        a: faker.sentence()
    });
}
