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

const path = require('path');
const fs = require('fs');

exports.handler = async function (event, context) {
    try {
        let result;
        result = await createCallFlowLexV2();
        return result;
    } catch (e) {
        console.log(e);
        return {
            statusCode: 500,
            message: e,
        };
    }
};

async function createCallFlowLexV2() {
    // Lex botAliasArn is of the format: arn:aws:lex:ca-central-1:123456789012:bot-alias/2S1UMN0YHX/RMG8IVED3J
    // NOTE: It's not yet clear if/how to associate GetCustomerInput block to specific localeId.. it seems to default to en_US. Requires further research.
    let botAliasArn = 'arn:aws:lex:';
    botAliasArn += `${process.env.region}:`;
    botAliasArn += `${process.env.accountId}:bot-alias/`;
    botAliasArn += `${process.env.LexV2BotId}/`;
    botAliasArn += process.env.LexV2BotAliasId;
    console.log('Building Genesys call flow for LexV2 bot. BotAliasArn: ', botAliasArn);

    const dir = `${__dirname}/flowsv2`;
    const flows = fs.readdirSync(dir);
    if (flows.length != 1) {
        throw new Error('message: Exactly one contact flow is currently supported');
    }
    const flowfile = path.join(dir, flows[0]);
    console.log('Processing contact flow file: ', flowfile);
    let rawdata = fs.readFileSync(flowfile);
    rawdata = rawdata.toString();
    rawdata = rawdata.replace('QNABOT_REGION', process.env.region);
    rawdata = rawdata.replace('QNABOT_NAME', process.env.LexV2BotName);
    rawdata = rawdata.replace('QNABOT_ALIAS', process.env.LexV2BotAlias);

    return rawdata;
}
