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

const { LexModelsV2Client, DescribeBotCommand } = require('@aws-sdk/client-lex-models-v2');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C022', { region }));
const lexv2 = new LexModelsV2Client(customSdkConfig('C002', { region }));


function getStatusResponse(response, build) {
    const botStatus = (response.botStatus == 'Available') ? 'READY' : response.botStatus;

    const statusResponse = {
        lambdaArn: process.env.FULFILLMENT_FUNCTION_ARN,
        lambdaRole: process.env.FULFILLMENT_FUNCTION_ROLE,
        botversion: 'live',
        botname: process.env.LEXV1_BOT_NAME || 'LEX V1 Bot not installed',
        intent: process.env.LEXV1_INTENT || 'LEX V1 Bot not installed',
        intentFallback: process.env.LEXV1_INTENT_FALLBACK || 'LEX V1 Bot not installed',
        lexV2botname: process.env.LEXV2_BOT_NAME || 'LEX V2 Bot not installed',
        lexV2botid: process.env.LEXV2_BOT_ID || 'LEX V2 Bot not installed',
        lexV2botalias: process.env.LEXV2_BOT_ALIAS || 'LEX V2 Bot not installed',
        lexV2botaliasid: process.env.LEXV2_BOT_ALIAS_ID || 'LEX V2 Bot not installed',
        lexV2intent: process.env.LEXV2_INTENT || 'LEX V2 Bot not installed',
        lexV2intentFallback: process.env.LEXV2_INTENT_FALLBACK || 'LEX V2 Bot not installed',
        lexV2localeids: process.env.LEXV2_BOT_LOCALE_IDS || 'LEX V2 Bot not installed',
        status: botStatus,
        build,
    };
    return statusResponse;
}

exports.handler = async (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const bucket = process.env.STATUS_BUCKET;
    const lexV1StatusFile = process.env.STATUS_KEY;
    const lexV2StatusFile = process.env.LEXV2_STATUS_KEY;
    let build = { status: 'READY', token: 'token' };
    let response;

    try {
        const getObjCmd = new GetObjectCommand({ Bucket: bucket, Key: lexV2StatusFile });
        response = await s3.send(getObjCmd);
        const readableStreamV2 = Buffer.concat(await response.Body.toArray());
        build = JSON.parse(readableStreamV2);
        // combine build status with v1 bot, if defined.. If both are READY then status is READY
        if (lexV1StatusFile) {
            const getObjCmd = new GetObjectCommand({ Bucket: bucket, Key: lexV1StatusFile });
            response = await s3.send(getObjCmd);
            const readableStreamV2 = Buffer.concat(await response.Body.toArray());
            const v1build = JSON.parse(readableStreamV2);
            if (v1build.status != 'READY' || build.status != 'READY') {
                build.status = `LEX V2: ${build.status} / LEX V1: ${v1build.status}`;
            }
        }
    } catch (e) {
        console.log('Unable to read S3 lex bot status file - perhaps it doesn\'t yet exist. Returning READY');
    }

    const describeBotCmd = new DescribeBotCommand({
        botId: process.env.LEXV2_BOT_ID,
    });
    response = await lexv2.send(describeBotCmd);
    // Match LexV1 bot status for code compatibility (Available = READY)
    const statusResponse = getStatusResponse(response, build);
    return statusResponse;
};
