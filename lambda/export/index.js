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
const _ = require('lodash');
const start = require('./lib/start');
const step = require('./lib/step');
const join = require('./lib/join');
const clean = require('./lib/clean');

exports.step=async function(event,context,cb){
    console.log('step')
    console.log('Request',JSON.stringify(event,null,2))
    const Bucket=event.Records[0].s3.bucket.name
    const Key=decodeURI(event.Records[0].s3.object.key)
    const VersionId=_.get(event,'Records[0].s3.object.versionId')
    console.log(Bucket,Key) 
    try {
        await s3.waitFor('objectExists',{Bucket,Key,VersionId}).promise()
        const res = await s3.getObject({Bucket,Key,VersionId}).promise()
        const config = JSON.parse(res.Body.toString())
        const step_status_ignore = ['Error', 'Completed', 'Sync Complete', 'Parsing content JSON', 'Creating FAQ']
        if (step_status_ignore.includes(config.status)===false) {
            try {
                console.log('Config:',JSON.stringify(config,null,2))
                switch(config.status){
                    case 'Started':
                        await start(config);
                        break
                    case 'InProgress':
                        await step(config);
                        break
                    case 'Join':
                        await join(config);
                        break
                    case 'Clean':
                        await clean(config);
                        break
                    }         
            } catch (err) {
                console.log(err)
                config.status='Error'
                config.message=_.get(err,'message',JSON.stringify(err))
            }
            await s3.putObject({Bucket,Key,Body:JSON.stringify(config)}).promise()
        }
    } catch (error) {
        console.error("An error occured in S3 operations: ", error)
        cb(error)
    }
}
