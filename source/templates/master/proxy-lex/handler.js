/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { LexModelBuildingService } = require('@aws-sdk/client-lex-model-building-service');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const lex = new LexModelBuildingService(customSdkConfig('C001', { region }));

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    lex[event.fnc](event.params)
        .then((x) => {
            console.log(`Response: ${JSON.stringify(x, null, 2)}`);
            callback(null, x);
        })
        .catch((y) => {
            console.log(`Error: ${y}`);
            callback(JSON.stringify({
                type: '[InternalServiceError]',
                data: y,
            }));
        });
};
