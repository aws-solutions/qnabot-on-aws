/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const mockConfigFull = require('./mockConfigFull.json');
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

    it('uses config params if config file is set', async () => {
        jest.mock('../../../config.json', () => mockConfigFull);

        const templateFile = await create('master');
        const expectResult = {
            Parameters: {
                BootstrapBucket: { Default: undefined },
                BootstrapPrefix: { Default: undefined },
                Email: { Default: 'user@example.com' },
                ApprovedDomain : { Default: 'example.com' },
                PublicOrPrivate: { Default: 'PRIVATE' },
                Language: { Default: 'English' },
                OpenSearchNodeCount: { Default: 1 },
                KendraWebPageIndexId: { Default: 'test' },
                KendraFaqIndexId: { Default: 'test' },
                AltSearchKendraIndexes: { Default: 'test' },
                AltSearchKendraIndexAuth: { Default: 'test' },
                Username: { Default: 'Admin' },
                XraySetting: { Default: 'TRUE' },
                EmbeddingsBedrockModelId: { Default: 'test' },
                LLMBedrockModelId: { Default: 'test' },
                BedrockKnowledgeBaseId: { Default: 'test' },
                BedrockKnowledgeBaseModel: { Default: 'anthropic.claude-instant-v1' },
                EmbeddingsLambdaArn : { Default: 'arn:aws:lambda:us-east-1:12345678910:function:qna-test' },
                LLMLambdaArn : { Default: 'arn:aws:lambda:us-east-1:12345678910:function:qna-test' },
                VPCSubnetIdList : { Default: 'vpc-subnet-test' },
                VPCSecurityGroupIdList : { Default: 'sg-test' },
                OpenSearchInstanceType : { Default: 'm6g.large.search' },
                FulfillmentConcurrency: { Default: 1 },
                LexV2BotLocaleIds: { Default: 'en_US,es_US,fr_CA' },
                LogRetentionPeriod: { Default: 0 },
                EmbeddingsApi: { Default: 'BEDROCK' },
                LLMApi: { Default: 'BEDROCK' },
                InstallLexResponseBots: { Default: true },
                OpenSearchFineGrainAccessControl: { Default: 'FALSE' },
                EnableStreaming: { Default: 'FALSE' },
            },
        };

        expect(templateFile).toEqual(expectResult);
    });
});
