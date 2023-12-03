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
const status = require('./statusv2');

const lambda = new aws.Lambda({
    httpOptions: {
        timeout: 900000, // time to wait for a response
    },
});
const functionName = process.env.LEXV2_BUILD_LAMBDA;
const bucket = process.env.STATUS_BUCKET;
const lexV2StatusFile = process.env.LEXV2_STATUS_KEY;

module.exports = async function (qidsandquestions) {
    const qidsandquestions_list = await qidsandquestions;
    console.log(`Invoking ${functionName} with Qids and Questions: ${JSON.stringify(qidsandquestions_list)}`);
    status('Starting LexV2 bot function');
    const result = await lambda.invoke({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(
            {
                statusFile: { Bucket: bucket, Key: lexV2StatusFile },
                items: qidsandquestions_list,
            },
        ),
    }).promise();
    console.log(`LexV2 bot lambda result:${JSON.stringify(result)}`);
    if (result.FunctionError) {
        console.log('Error Response');
        throw result;
    }
    return result;
};
