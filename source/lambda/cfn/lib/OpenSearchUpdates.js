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

const { OpenSearchClient, UpdateDomainConfigCommand } = require('@aws-sdk/client-opensearch');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const client = new OpenSearchClient(customSdkConfig({ region }));

module.exports = class OpenSearchUpdates extends require('./base') {
    constructor() {
        super();
    }
    async Create(params, reply){
        try {
            const input = {
                DomainName: params.DomainName,
                AccessPolicies: JSON.stringify(params.AccessPolicies),
                AdvancedSecurityOptions: params.AdvancedSecurityOptions,
                LogPublishingOptions: params.LogPublishingOptions,
            };
            console.log('Updating OpenSearch Domain Config: ', input);
            const response = await client.send(new UpdateDomainConfigCommand(input));
            console.log('OpenSearch Update Status: ', response?.$metadata?.httpStatusCode);
            reply(null, params.DomainName);
        } catch (e) {
            console.log('An error occured while updating opensearch domain config: ', e);
            reply(e);
        }
    }

    async Update(ID, params, oldparams, reply) {
        await this.Create(params, reply);
    }
}
