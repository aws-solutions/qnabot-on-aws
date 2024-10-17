/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
