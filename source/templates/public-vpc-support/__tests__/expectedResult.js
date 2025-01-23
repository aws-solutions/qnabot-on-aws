/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    Conditions: {
        AdminSignUp: {
            'Fn::Equals': [true, true],
        },
        BuildExamples: {
            'Fn::Equals': [true, true],
        },
        FGACEnabled: {
            'Fn::Equals': [true, true],
        },
        BedrockEnable: {
            'Fn::Or': [
                {
                    'Fn::Equals': [
                        {
                            'Ref': 'LLMApi'
                        },
                        'BEDROCK',
                    ],
                },
                {
                    'Fn::Equals': [
                        {
                            'Ref': 'EmbeddingsApi'
                        },
                        'BEDROCK',
                    ],
                },
            ],
        },
        CreateDomain: {
            'Fn::Equals': [true, true],
        },
        Domain: {
            'Fn::Equals': [true, false],
        },
        DontCreateDomain: {
            'Fn::Equals': [true, false],
        },
        EmbeddingsEnable: {
            'Fn::Not': [
                {
                    'Fn::Equals': [
                        {
                            Ref: 'EmbeddingsApi',
                        },
                        'DISABLED',
                    ],
                },
            ],
        },
        EmbeddingsLambda: {
            'Fn::Equals': [
                {
                    Ref: 'EmbeddingsApi',
                },
                'LAMBDA',
            ],
        },
        EmbeddingsLambdaArn: {
            'Fn::Not': [
                {
                    'Fn::Equals': [
                        {
                            Ref: 'EmbeddingsLambdaArn',
                        },
                        '',
                    ],
                },
            ],
        },
        EmbeddingsBedrock: {
            'Fn::Equals': [
                {
                    Ref: 'EmbeddingsApi',
                },
                'BEDROCK',
            ],
        },
        Public: {
            'Fn::Equals': [
                {
                    Ref: 'PublicOrPrivate',
                },
                'PUBLIC',
            ],
        },
        VPCEnabled: {
            'Fn::Not': [
                {
                    'Fn::Equals': [
                        '',
                        {
                            'Fn::Join': [
                                '',
                                {
                                    Ref: 'VPCSecurityGroupIdList',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    Description: '(SO0189) QnABot with admin and client websites - Version vx.x.x',
    Metadata: {
        'AWS::CloudFormation::Interface': {
            ParameterGroups: [
                {
                    Label: {
                        default: 'Step 2A: Set Basic Chatbot Parameters (required)',
                    },
                    Parameters: [
                        'Email',
                        'Username',
                        'PublicOrPrivate',
                        'Language',
                        'OpenSearchInstanceType',
                        'OpenSearchNodeCount',
                        'OpenSearchEBSVolumeSize',
                        'OpenSearchDashboardsRetentionMinutes',
                        'OpenSearchFineGrainAccessControl',
                        'LexV2BotLocaleIds',
                        'LexBotVersion',
                        'InstallLexResponseBots',
                        'FulfillmentConcurrency',
                        'XraySetting',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2B: Set VPC parameters to deploy QnABot in an existing VPC (required)',
                    },
                    Parameters: [
                        'VPCSubnetIdList',
                        'VPCSecurityGroupIdList',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2C: Enable LLM for Semantic Search with Embeddings (optional)',
                    },
                    Parameters: [
                        'EmbeddingsApi',
                        'EmbeddingsBedrockModelId',
                        'EmbeddingsLambdaArn',
                        'EmbeddingsLambdaDimensions',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2D: Enable LLM Retrieval and generative text question answering to use with Fallback Option (optional)',
                    },
                    Parameters: [
                        'LLMApi',
                        'LLMBedrockModelId',
                        'LLMLambdaArn',
                        'EnableStreaming'
                    ],
                },
                {
                    Label: {
                        default: 'Step 2E: Select Data Sources as Fallback Option (optional)',
                    },
                    Parameters: [
                        'KendraWebPageIndexId',
                        'KendraFaqIndexId',
                        'AltSearchKendraIndexes',
                        'BedrockKnowledgeBaseId',
                        'BedrockKnowledgeBaseModel',
                    ],
                },
            ],
        },
    },
    Outputs: {},
    Parameters: {
        VPCSubnetIdList: {
            Type: 'List<AWS::EC2::Subnet::Id>',
            AllowedPattern: '.+',
        },
        VPCSecurityGroupIdList: {
            Type: 'List<AWS::EC2::SecurityGroup::Id>',
            AllowedPattern: '.+',
        },
    },
};
