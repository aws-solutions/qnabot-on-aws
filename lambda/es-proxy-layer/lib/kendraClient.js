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

const _ = require('lodash');
const { ConfiguredRetryStrategy } = require('@smithy/util-retry');
const { Kendra } = require('@aws-sdk/client-kendra');
const customSdkConfig = require('../lib/util/customSdkConfig');
const qnabot = require('qnabot/logging');

const region = process.env.AWS_REGION || 'us-east-1';

function getKendraClient(maxRetries, retryDelay) {
    const retryStrategy = new ConfiguredRetryStrategy(maxRetries + 1, retryDelay);

    const kendraClient = (process.env.REGION
        ? new Kendra(customSdkConfig('C007', { apiVersion: '2019-02-03', region: process.env.REGION, retryStrategy }))
        : new Kendra(customSdkConfig('C007', { apiVersion: '2019-02-03' , region, retryStrategy }))
    );

    return kendraClient;
}

/**
 * Function to query kendraClient and return results via Promise
 * @param resArray
 * @param index
 * @param query
 * @param kendraArgs
 * @param maxRetries
 * @param retryDelay
 * @returns {*}
 */
function queryKendra(resArray, index, query, kendraArgs, maxRetries, retryDelay) {
    const kendraClient = getKendraClient(maxRetries, retryDelay);
    let params = {
        IndexId: index,
        QueryText: query,
    };

    qnabot.log(`Kendra query args: ${kendraArgs}`);
    for (const argString of kendraArgs) {
        qnabot.log(`Adding parameter '${argString}'`);
        const argJSON = `{ ${argString} }`; // convert k:v to a JSON obj
        const arg = JSON.parse(argJSON);
        params = _.assign(params, arg);
    }

    return new Promise((resolve, reject) => {
        qnabot.log(`Kendra request params:${JSON.stringify(params, null, 2)}`);
        kendraClient.query(params, (err, data) => {
            const indexId = params.IndexId;
            if (err) {
                qnabot.log(err, err.stack);
                reject(`Error from Kendra query request:${err}`);
            } else {
                data.originalKendraIndexId = indexId;
                qnabot.log(`Kendra response:${JSON.stringify(data, null, 2)}`);
                resArray.push(data);
                resolve(data);
            }
        });
    });
}

async function retrievalKendra(params, maxRetries, retryDelay) {
    const kendraClient = getKendraClient(maxRetries, retryDelay);
    const response = await kendraClient.retrieve(params);
    qnabot.log('Debug: Retrieve API response: ', JSON.stringify(response, null, 2));
    return response;
}

module.exports = {
    queryKendra,
    retrievalKendra,
};
