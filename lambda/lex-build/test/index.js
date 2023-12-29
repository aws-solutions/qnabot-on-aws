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

const lambda=require('./setup.js')
const outputs=require('../../../bin/exports')
const run=function(params,test){
    return lambda(params)
        .then(msg=>console.log(JSON.stringify(msg)))
        .then(test.ok)
        .catch(test.ifError)
        .finally(test.done)
}

module.exports={
    build:async function(test){
        const master=await outputs('dev/master',{wait:true})
        const lambda=await outputs('dev/lambda',{wait:true})

        process.env.POLL_LAMBDA=lambda.lambda
        process.env.BOTNAME=master.BotName
        process.env.SLOTTYPE=master.SlotType
        process.env.INTENT=master.Intent
        process.env.ADDRESS=master.ElasticsearchEndpoint
        process.env.INDEX=master.ElasticsearchIndex
        process.env.TYPE=master.ElasticsearchType
       
        const params={}
        run(params,test)
    }
}


