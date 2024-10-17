/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
