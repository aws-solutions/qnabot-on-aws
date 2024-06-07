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
