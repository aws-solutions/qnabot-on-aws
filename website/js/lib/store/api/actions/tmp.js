/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const region = 'us-east-1';
const s3 = new S3Client({ region });

run();

async function run() {
    const result = await s3.send(new GetObjectCommand({
        Bucket: 'qna-dev-dev-master-40-exportbucket-fgiztk0ghtl5',
        Key: 'data/qna.jsond',
    }));
    const raw = await result.Body.transformToString();
    console.log(`[${raw.replace(/$/g, ',')}]`);
}
