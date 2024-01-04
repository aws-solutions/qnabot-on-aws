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

const _=require('lodash')
const config=require('../../../config.json')
const outputs=require('../../../bin/exports')
const api=require('./util').api
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const region = config.region
const lambda = new LambdaClient({ region })

module.exports={
    setUp:async function(done){
        this.services=await api({
            path:'services',
            method:'GET'
        })
        done()
    },
    qid:async function(test){
        const result=await lambda.send(new InvokeCommand({
            FunctionName:this.services.elasticsearch.qid,
            Payload:JSON.stringify({qid:'test.1'}),
            InvocationType:"RequestResponse"
        }))
        test.equal(result.StatusCode, 200)
        test.done()
    },
    proxy:async function(test){
        const output=await outputs('dev/master')
        try {
            const result=await lambda.send(new InvokeCommand({
                FunctionName:this.services.elasticsearch.proxy,
                Payload:JSON.stringify({
                    endpoint:output.ElasticsearchEndpoint,
                    path:'/',
                    method:"GET"
                }),
                InvocationType:"RequestResponse"
            }))
            test.equal(result.StatusCode,200)
            test.done()
        } catch (error) {
            console.error("An error occurred in invoking test services: ", error);
            throw error;
        }
    }
}


