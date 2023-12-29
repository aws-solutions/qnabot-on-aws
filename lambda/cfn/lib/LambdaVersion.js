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

const { LambdaClient, PublishVersionCommand } = require('@aws-sdk/client-lambda');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const lambda = new LambdaClient(customSdkConfig({ region }));

module.exports = class LambdaVersion extends require('./base') {
    constructor() {
        super();
    }

    async Create(params, reply) {
        try {
            const result = await lambda.send(new PublishVersionCommand({
                FunctionName: params.FunctionName,
            }));
            console.log(result);
            reply(null, result.Version, { Version: result.Version });
        } catch (e) {
            reply(e);
        }
    }

    async Update(ID, params, oldparams, reply) {
        await this.Create(params, reply);
    }
};
