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
                Username : { Default: 'Admin' },
                XraySetting: { Default: 'TRUE' },
                EmbeddingsBedrockModelId: { Default: 'test' },
                LLMBedrockModelId: { Default: 'test' },
                BedrockKnowledgeBaseId: { Default: 'test' },
                BedrockKnowledgeBaseModel: { Default: 'anthropic.claude-instant-v1' },
                EmbeddingsLambdaArn : { Default: 'arn:aws:lambda:us-east-1:12345678910:function:qna-test' },
                LLMSagemakerInstanceType : { Default: 'ml.g5.12xlarge' },
                LLMLambdaArn : { Default: 'arn:aws:lambda:us-east-1:12345678910:function:qna-test' },
                VPCSubnetIdList : { Default: 'vpc-subnet-test' },
                VPCSecurityGroupIdList : { Default: 'sg-test' },
                OpenSearchInstanceType : { Default: 'm6g.large.search' },
                LexBotVersion: { Default: 'LexV2 Only' },
                FulfillmentConcurrency: { Default: 1 },
                LexV2BotLocaleIds: { Default: 'en_US,es_US,fr_CA' },
                EmbeddingsApi: { Default: 'SAGEMAKER' },
                LLMApi: { Default: 'SAGEMAKER' },
                InstallLexResponseBots: { Default: true },
                OpenSearchFineGrainAccessControl: { Default: 'FALSE' },
            },
        };

        expect(templateFile).toEqual(expectResult);
    });
});
