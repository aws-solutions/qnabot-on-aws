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

aws.config = 'us-east-1';
const s3 = new aws.S3();

run();

async function run() {
    const result = await s3.getObject({
        Bucket: 'qna-dev-dev-master-40-exportbucket-fgiztk0ghtl5',
        Key: 'data/qna.jsond',
    }).promise();
    const raw = result.Body.toString();
    console.log(`[${raw.replace(/$/g, ',')}]`);
}
