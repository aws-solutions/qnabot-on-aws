/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
                OpenSearchNodeInstanceType: { Default: 'test' },
                EmbeddingsLambdaArn: { Default: '0000000000000000000000000000000000000:function:test' },
                KendraWebPageIndexId: { Default: 'test' },
                KendraFaqIndexId: { Default: 'test' },
                AltSearchKendraIndexes: { Default: 'test' },
                AltSearchKendraIndexAuth: { Default: 'test' },
                FulfillmentConcurrency: { Default: 'test' },
                LexV2BotLocaleIds: { Default: 'test' },
                LogRetentionPeriod: { Default: 0 },
                EmbeddingsApi: { Default: 'test' },
                LLMApi: { Default: 'test' },
                EmbeddingsBedrockModelId: { Default: 'test' },
                LLMBedrockModelId: { Default: 'test' },
                BedrockKnowledgeBaseId: { Default: 'test' },
                BedrockKnowledgeBaseModel: { Default: 'anthropic.claude-instant-v1' },
                LLMLambdaArn: { Default: '0000000000000000000000000000000000000:function:test' },
                InstallLexResponseBots: { Default: 'test' },
                Username: { Default: 'test' },
                VPCSecurityGroupIdList: { Default: 'sg-0000000000000000,sg-0000000000000000' },
                VPCSubnetIdList: { Default: 'test' },
                XraySetting: { Default: 'test' },
                OpenSearchFineGrainAccessControl: { Default: 'FALSE' },
                EnableStreaming: { Default: 'FALSE' },
                OpenSearchDedicatedMasterNodes: { Default: 'DISABLED' },
                OpenSearchMasterNodeCount: { Default: 'test' },
                OpenSearchMasterNodeInstanceType: { Default: 'test' },
            },
        };
        expect(templateFile).toEqual(expectResult);
    });
});
