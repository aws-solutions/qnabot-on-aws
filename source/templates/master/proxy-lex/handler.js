/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { LexModelBuildingService } = require('@aws-sdk/client-lex-model-building-service');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const lex = new LexModelBuildingService(customSdkConfig('C001', { region }));

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        const result = await lex[event.fnc](event.params);
        console.log(`Response: ${JSON.stringify(result, null, 2)}`);
        return result;
    } catch (error) {
        console.log(`Error: ${error}`);
        throw JSON.stringify({
            type: '[InternalServiceError]',
            data: error,
        });
    }
};
