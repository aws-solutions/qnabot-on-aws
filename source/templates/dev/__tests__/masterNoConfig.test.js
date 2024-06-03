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

const mockConfigEmpty = require('./mockConfigEmpty.json');
const mockMaster = require('./mockMaster.js')

function create(filename) {
    const file = `../${filename}`;
    return require(file);
}

describe('master template with config', () => {
    afterEach(() => {
        jest.resetModules();
    });

    jest.mock('../../../bin/exports', () => jest.fn(() => {
        return {
            output: {
                Bucket: 'bucket',
                Prefix: 'prefix',
                devEmail: 'email',
            },
        }
    }));

    jest.mock('../../master', () => mockMaster);

    it('uses default params if config file is not set', async () => {
        jest.mock('../../../config.json', () => mockConfigEmpty);

        const templateFile = await create('master');
        const expectResult = {
            Parameters: {
                ApprovedDomain: { Default: 'test' },
                BootstrapBucket: { Default: undefined },
                BootstrapPrefix: { Default: undefined },
                Email: { Default: undefined },
                PublicOrPrivate: { Default: 'test' },
                Language: { Default: 'test' },
                OpenSearchNodeCount: { Default: 'test' },
                OpenSearchInstanceType: { Default: 'test' },
                EmbeddingsLambdaArn: { Default: '0000000000000000000000000000000000000:function:test' },
                KendraWebPageIndexId: { Default: 'test' },
                KendraFaqIndexId: { Default: 'test' },
                AltSearchKendraIndexes: { Default: 'test' },
                AltSearchKendraIndexAuth: { Default: 'test' },
                LexBotVersion: { Default: 'test' },
                FulfillmentConcurrency: { Default: 'test' },
                LexV2BotLocaleIds: { Default: 'test' },
                EmbeddingsApi: { Default: 'test' },
                LLMApi: { Default: 'test' },
                EmbeddingsBedrockModelId: { Default: 'test' },
                LLMBedrockModelId: { Default: 'test' },
                BedrockKnowledgeBaseId: { Default: 'test' },
                BedrockKnowledgeBaseModel: { Default: 'anthropic.claude-instant-v1' },
                LLMLambdaArn: { Default: '0000000000000000000000000000000000000:function:test' },
                LLMSagemakerInstanceType: { Default: 'test' },
                InstallLexResponseBots: { Default: 'test' },
                Username: { Default: 'test' },
                VPCSecurityGroupIdList: { Default: 'sg-0000000000000000,sg-0000000000000000' },
                VPCSubnetIdList: { Default: 'test' },
                XraySetting: { Default: 'test' },
                OpenSearchFineGrainAccessControl: { Default: 'FALSE' },
            },
        };
        expect(templateFile).toEqual(expectResult);
    });
});
