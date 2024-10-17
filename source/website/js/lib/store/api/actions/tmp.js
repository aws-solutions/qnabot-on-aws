/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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
