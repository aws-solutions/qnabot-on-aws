/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
