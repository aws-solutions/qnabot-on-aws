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
process.env.STRIDE="10000"
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
process.env.AWS_REGION=config.region

const outputs=require('../../../bin/exports')
const aws=require("aws-sdk")
aws.config.region=config.region
const handler=require('../index')
const gen=require('./gen')

function promisify(func) { 
    return function(...args) {
        return new Promise((resolve,reject) => {
            func(...args, (err,data) => {
                if(err) reject(err)
                else resolve(data)
            })
        })
    }
}
const startAsync=promisify(handler.start)
const stepAsync=promisify(handler.step)

module.exports={
    test:async function(test){
        try {
            await gen()
            const [bucket, master] = await Promise.all([
                outputs('dev/bucket').get('Bucket'),
                outputs('dev/master')])
            console.log(bucket,master)

            process.env.ES_ENDPOINT=master.ElasticsearchEndpoint
            process.env.ES_PROXY=master.ESProxyLambda
            process.env.ES_TYPE=master.ElasticsearchType
            process.env.ES_INDEX=master.ElasticsearchIndex

            await startAsync({
                Records:[{
                    s3:{
                        object:{key:"import/bulk-test"},
                        bucket:{name:bucket}
                    }
                }]
            })
            await delay(10000)

            await stepAsync({
                Records:[{
                    s3:{
                        object:{key:"status/bulk-test"},
                        bucket:{name:bucket}
                    }
                }]
            })
            await delay(10000)

            await stepAsync({
                Records:[{
                    s3:{
                        object:{key:"status/bulk-test"},
                        bucket:{name:bucket}
                    }
                }]
            })
            
        } catch (error) {
            test.ifError(error)
        } finally {
            test.done()
        }
    }
};
function delay(ms) {
    return new Promise(res => setTimeout(res, ms))
}