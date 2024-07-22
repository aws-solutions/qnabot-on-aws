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

const { LexRuntimeV2Client, RecognizeTextCommand } = require('@aws-sdk/client-lex-runtime-v2');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');

const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C012', { region }));
const lexv2 = new LexRuntimeV2Client(customSdkConfig('C012', { region }));
const MAX_EXECUTION_TIME_MS = 870000;

async function processRecognizeText(topic, token, question, locale, exp_qid, res) {
    const params = {
        botId: process.env.LEXV2_BOT_ID,
        botAliasId: process.env.LEXV2_BOT_ALIAS_ID,
        localeId: locale,
        sessionId: 'automated-tester1',
        sessionState: { sessionAttributes: { topic, idtokenjwt: token } },
        text: question,
    };
    const recognizeTextCmd = new RecognizeTextCommand(params);
    const resp = await lexv2.send(recognizeTextCmd);
    let res_qid = resp.sessionState.sessionAttributes.qnabot_qid || 'NO_QID_IN_RESPONSE';
    let m1 = resp.messages[0].content.toString().replace(/\"/g, '');
    m1 = m1.replace(/(\r\n)+|\r+|\n+|\t+/i, ' ');
    const res_msg = `"${m1}"`;
    const result_matches = (exp_qid === res_qid) ? 'Yes' : 'No';
    res += `${result_matches},${question},${topic},${exp_qid},${res_qid},${res_msg}\n`;
    return res;
}

async function processWithLex(data, filter, token, locale) {
    let counter; 
    const start = Date.now();
    const orig = JSON.parse(data);
    let res = 'Match(Yes/No), Question, Topic, QID, Returned QID, Returned Message\n';
    for (const [, item] of Object.entries(orig)) {
        if (!item.type || item.type !== 'qna') {
            continue;
        }
        const topic = item.t || '';
        const exp_qid = item.qid;
        for (const [, question] of Object.entries(item.q)) {
            try {
                res = await processRecognizeText(topic, token, question, locale, exp_qid, res);
                counter = Date.now() - start;
                if (counter > MAX_EXECUTION_TIME_MS){ // workaround to handle lambda timeout in ms
                    console.warn(`The lambda operation has timed out in ${counter} ms`);
                    res += 'Unable to Complete - The operation times out approximately at 15 mins. Try selecting a small subset of questions by filtering using qid prefix.';
                    return res;
                } 
            } catch (err) {
                const msg = `"${err.toString().replace(/\n/g, '')}"`;
                res += 'No' + `,${question},${topic},${exp_qid},` + 'undefined' + `,${msg}\n`;
                console.warn('An error while processing questions with Lex: ', msg);
            }
        }
    }
    return res;
}
module.exports = async function (config) {
    try {
        const parts = await Promise.all(config.parts.map(async (part) => {
            const params = {
                Bucket: config.bucket,
                Key: part.key,
                VersionId: config.version,
            };
            const getObjCmd = new GetObjectCommand(params);
            const s3GetObj = await s3.send(getObjCmd);
            const readableStream = Buffer.concat(await s3GetObj.Body.toArray());
            return readableStream;
        }));
        const qa = parts.toString();
        const arrayOfParts = `[${qa.replace(/\n/g, ',\n')}]`;
        const contents = await processWithLex(arrayOfParts, config.filter, config.token, config.locale);
        const params = {
            Bucket: config.bucket,
            Key: config.key,
            Body: contents,
        };
        const s3PutCmd = new PutObjectCommand(params);
        await s3.send(s3PutCmd);
        config.status = 'Clean';
    } catch (error) {
        console.error('An error occurred in Lex task: ', error);
        throw error;
    }
};
