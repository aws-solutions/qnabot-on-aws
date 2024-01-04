module.exports = {
    Conditions: {
        AdminSignUp: {
            'Fn::Equals': [true, true],
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
        EmbeddingsSagemaker: {
            'Fn::Equals': [
                {
                    Ref: 'EmbeddingsApi',
                },
                'SAGEMAKER',
            ],
        },
        Encrypted: {
            'Fn::Equals': [
                {
                    Ref: 'Encryption',
                },
                'ENCRYPTED',
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
    Description: '(SO0189-vpc) QnABot with admin and client websites - Version vx.x.x',
    Metadata: {
        'AWS::CloudFormation::Interface': {
            ParameterGroups: [
                {
                    Label: {
                        default: 'Authentication',
                    },
                    Parameters: ['Email', 'Username', 'PublicOrPrivate', 'Language'],
                },
                {
                    Label: {
                        default: 'VPC',
                    },
                    Parameters: ['VPCSubnetIdList', 'VPCSecurityGroupIdList'],
                },
                {
                    Label: {
                        default: 'Amazon Kendra Integration',
                    },
                    Parameters: ['DefaultKendraIndexId'],
                },
                {
                    Label: {
                        default: 'Amazon OpenSearch Service',
                    },
                    Parameters: [
                        'ElasticSearchInstanceType',
                        'ElasticSearchNodeCount',
                        'ElasticSearchEBSVolumeSize',
                        'Encryption',
                        'KibanaDashboardRetentionMinutes',
                    ],
                },
                {
                    Label: {
                        default: 'Amazon LexV2',
                    },
                    Parameters: ['LexV2BotLocaleIds'],
                },
                {
                    Label: {
                        default: 'Semantic Search with Embeddings',
                    },
                    Parameters: [
                        'EmbeddingsApi',
                        'SagemakerInitialInstanceCount',
                        'EmbeddingsLambdaArn',
                        'EmbeddingsLambdaDimensions',
                    ],
                },
                {
                    Label: {
                        default: 'LLM integration for contextual followup and generative answers',
                    },
                    Parameters: [
                        'LLMApi',
                        'LLMSagemakerInstanceType',
                        'LLMSagemakerInitialInstanceCount',
                        'LLMLambdaArn',
                    ],
                },
                {
                    Label: {
                        default: 'Miscellaneous',
                    },
                    Parameters: ['LexBotVersion', 'InstallLexResponseBots', 'FulfillmentConcurrency', 'XraySetting'],
                },
            ],
        },
    },
    Outputs: {},
    Parameters: {},
};
