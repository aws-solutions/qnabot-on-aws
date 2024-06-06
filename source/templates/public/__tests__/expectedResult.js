module.exports = {
    Conditions: {
        AdminSignUp: {
            'Fn::Equals': [true, true],
        },
        FGACEnabled: {
            "Fn::Equals": [true, true]
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
        BuildExamples: {
            'Fn::Equals': [true, true],
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
        EmbeddingsSagemaker: {
            'Fn::Equals': [
                {
                    Ref: 'EmbeddingsApi',
                },
                'SAGEMAKER',
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
        SingleNode: {
            'Fn::Equals': [
                {
                    Ref: 'OpenSearchNodeCount',
                },
                '1',
            ],
        },
        VPCEnabled: {
            'Fn::Equals': [true, false],
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
                        default: 'Step 2B: Enable LLM for Semantic Search with Embeddings (optional)',
                    },
                    Parameters: [
                        'EmbeddingsApi',
                        'EmbeddingsBedrockModelId',
                        'SagemakerInitialInstanceCount',
                        'EmbeddingsLambdaArn',
                        'EmbeddingsLambdaDimensions',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2C: Enable LLM Retrieval and generative text question answering to use with Fallback Option (optional)',
                    },
                    Parameters: [
                        'LLMApi',
                        'LLMBedrockModelId',
                        'LLMSagemakerInstanceType',
                        'LLMSagemakerInitialInstanceCount',
                        'LLMLambdaArn',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2D: Select Data Sources as Fallback Option (optional)',
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
    Parameters: {},
};
