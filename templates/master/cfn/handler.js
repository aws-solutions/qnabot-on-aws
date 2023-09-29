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

const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = function (event, context) {
    console.log(JSON.stringify(event, null, 2));
    if (event.RequestType !== 'Delete') {
        client.send(new HeadObjectCommand({
            Bucket: event.ResourceProperties.Bucket,
            Key: event.ResourceProperties.Key,
        }))
            .then((result) => send(event, context, SUCCESS, {
                version: result.VersionId ? result.VersionId : 1,
            }))
            .catch((x) => {
                console.log(x);
                send(event, context, FAILED);
            });
    } else {
        send(event, context, SUCCESS);
    }
};
