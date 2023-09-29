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

const aws = require('./aws');

const s3 = new aws.S3();

const bucket=process.env.STATUS_BUCKET;
const lexV2StatusFile=process.env.LEXV2_STATUS_KEY;
    
module.exports=async function(status,message){
    try {
        const res = await s3.getObject({
            Bucket:bucket,
            Key:lexV2StatusFile,
        }).promise()
        const result = JSON.parse(res.Body.toString())
        if(message) result.message=message;
        result.status=status;
        console.log(result);
        await s3.putObject({
            Bucket:bucket,
            Key:lexV2StatusFile,
            Body:JSON.stringify(result)
        }).promise();
        
    } catch (error) {
        console.error("An error occured in statusv2: ", error)
        throw new Error(error)
    }
};
