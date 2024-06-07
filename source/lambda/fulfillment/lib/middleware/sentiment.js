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

// start connection
const { Comprehend } = require('@aws-sdk/client-comprehend');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION || 'us-east-1';
const qnabot = require('qnabot/logging');

async function get_sentiment_from_comprehend(utterance) {
    // get sentiment and scores from utterance using Comprehend detectSentiment api
    qnabot.debug('detecting sentiment from utterance using Comprehend: ', utterance);
    const comprehend = new Comprehend(customSdkConfig('C020', { region }));
    const comprehend_params = {
        LanguageCode: 'en',
        Text: utterance,
    };
    try {
        const data = await comprehend.detectSentiment(comprehend_params)
        qnabot.log(JSON.stringify(data))
        return data
    } catch (error) {
        qnabot.log("An error occured in detecting sentiment: ", error);
        throw error;
    }
}

module.exports = function (utterance) {
    return get_sentiment_from_comprehend(utterance);
};
