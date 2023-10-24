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
const lexv2 = new aws.LexRuntimeV2();

async function processWithLex(data, filter, token) {
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
                const resp = await lexv2.recognizeText({
                    botId: process.env.LEXV2_BOT_ID,
                    botAliasId: process.env.LEXV2_BOT_ALIAS_ID,
                    localeId: 'en_US',
                    sessionId: 'automated-tester1',
                    sessionState: { sessionAttributes: { topic, idtokenjwt: token } },
                    text: question,
                }).promise();
                let res_qid = resp.sessionState.sessionAttributes.qnabot_qid || 'NO_QID_IN_RESPONSE';
                let m1 = resp.messages[0].content.toString().replace(/\"/g, '');
                m1 = m1.replace(/(\r\n)+|\r+|\n+|\t+/i, ' ');
                const res_msg = `"${m1}"`;
                const result_matches = (exp_qid === res_qid) ? 'Yes' : 'No';
                res += `${result_matches},${question},${topic},${exp_qid},${res_qid},${res_msg}\n`;
            } catch (err) {
                const msg = `"${err.toString().replace(/\n/g, '')}"`;
                res += 'No' + `,${question},${topic},${exp_qid},` + 'undefined' + `,${msg}\n`;
            }
        }
    }
    return res;
}
module.exports = async function (config) {
    try {
        const parts = await Promise.all(config.parts.map(async (part) => {
            const s3getObj = await s3.getObject({
                Bucket: config.bucket,
                Key: part.key,
                VersionId: config.version,
            }).promise();
            return s3getObj.Body.toString();
        }));
        const qa = parts.toString();
        const arrayOfParts = `[${qa.replace(/\n/g, ',\n')}]`;
        const contents = await processWithLex(arrayOfParts, config.filter, config.token);
        await s3.putObject({
            Bucket: config.bucket,
            Key: config.key,
            Body: contents,
        }).promise();
        config.status = 'Clean';
    } catch (error) {
        console.error('An error occured in lex task: ', error);
        throw error;
    }
};
