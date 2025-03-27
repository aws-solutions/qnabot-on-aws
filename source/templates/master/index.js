/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const _ = require('lodash');

const files = [
    require('./UpgradeAutoExport'),
    require('./appregistry'),
    require('./assets'),
    require('./bucket'),
    require('./cfn'),
    require('./cognito'),
    require('./config'),
    require('./dashboard'),
    require('./dynamodb'),
    require('./examples'),
    require('./exportstack'),
    require('./importstack'),
    require('./lambda-layers'),
    require('./lambda'),
    require('./lex'),
    require('./lex-build'),
    require('./lexv2-build'),
    require('./opensearch'),
    require('./policies.json'),
    require('./proxy-es'),
    require('./proxy-lex'),
    require('./roles.json'),
    require('./routes'),
    require('./s3'),
    require('./s3-clean'),
    require('./schemaLambda'),
    require('./settings'),
    require('./signup'),
    require('./solution-helper'),
    require('./streamingstack'),
    require('./tstallstack'),
    require('./var'),
];

const mappings = fs
    .readdirSync(`${__dirname}/mappings`)
    .map((x) => require(`./mappings/${x}`));

module.exports = {
    Resources: _.assign.apply({}, files),
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `(SO0189-ext) QnABot with admin and client websites - Version v${process.env.npm_package_version}`,
    Mappings: _.assign.apply({}, mappings),
    Outputs: {
        CognitoEndpoint: {
            Value: { 'Fn::GetAtt': ['DesignerLogin', 'Domain'] },
        },
        UserRole: {
            Value: { Ref: 'UserRole' },
        },
        ImportBucket: {
            Value: { Ref: 'ImportBucket' },
        },
        LexV2BotName: {
            Value: { 'Fn::GetAtt': ['LexV2Bot', 'botName'] },
        },
        LexV2BotId: {
            Value: { 'Fn::GetAtt': ['LexV2Bot', 'botId'] },
        },
        LexV2BotAlias: {
            Value: { 'Fn::GetAtt': ['LexV2Bot', 'botAlias'] },
        },
        LexV2BotAliasId: {
            Value: { 'Fn::GetAtt': ['LexV2Bot', 'botAliasId'] },
        },
        LexV2Intent: {
            Value: { 'Fn::GetAtt': ['LexV2Bot', 'botIntent'] },
        },
        LexV2IntentFallback: {
            Value: { 'Fn::GetAtt': ['LexV2Bot', 'botIntentFallback'] },
        },
        LexV2BotLocaleIds: {
            Value: { 'Fn::GetAtt': ['LexV2Bot', 'botLocaleIds'] },
        },
        CloudWatchDashboardURL: {
            Value: {
                'Fn::Join': [
                    '',
                    [
                        'https://console.aws.amazon.com/cloudwatch/home?',
                        'region=',
                        { Ref: 'AWS::Region' },
                        '#dashboards:name=',
                        { Ref: 'dashboard' },
                    ],
                ],
            },
        },
        UserPoolURL: {
            Value: {
                'Fn::Join': [
                    '',
                    [
                        'https://console.aws.amazon.com/cognito/users/',
                        '?region=',
                        { Ref: 'AWS::Region' },
                        '#/pool/',
                        { Ref: 'UserPool' },
                        '/details',
                    ],
                ],
            },
        },
        Bucket: {
            Value: { Ref: 'Bucket' },
        },
        IdPool: {
            Value: { Ref: 'IdPool' },
        },
        ApiEndpoint: {
            Value: { 'Fn::GetAtt': ['ApiUrl', 'Name'] },
        },
        ESProxyLambda: {
            Value: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
        },
        CFNESProxyLambda: {
            Value: { 'Fn::GetAtt': ['ESCFNProxyLambda', 'Arn'] },
        },
        ContentDesignerURL: {
            Value: {
                'Fn::Join': ['', [{ 'Fn::GetAtt': ['ApiUrl', 'Name'] }, '/pages/designer']],
            },
        },
        ClientURL: {
            Value: {
                'Fn::If': [
                    'Public',
                    { 'Fn::GetAtt': ['Urls', 'Client'] },
                    {
                        'Fn::Join': ['', [{ 'Fn::GetAtt': ['ApiUrl', 'Name'] }, '/pages/client']],
                    },
                ],
            },
        },
        ApiId: {
            Value: { Ref: 'API' },
        },
        UserPool: {
            Value: { Ref: 'UserPool' },
        },
        DesignerClientId: {
            Value: { Ref: 'ClientDesigner' },
        },
        ClientClientId: {
            Value: { Ref: 'ClientClient' },
        },
        OpenSearchDomainEndpoint: {
            Value: { 
                'Fn::Join': [
                    '', 
                    ['https://', { 'Fn::GetAtt': ['ESVar', 'ESAddress'] }]
                ]
            },
        },
        OpenSearchQnAType: {
            Value: { 'Fn::GetAtt': ['Var', 'QnAType'] },
        },
        OpenSearchQuizType: {
            Value: { 'Fn::GetAtt': ['Var', 'QuizType'] },
        },
        OpenSearchIndex: {
            Value: { 'Fn::GetAtt': ['Var', 'index'] },
        },
        UsersTable: {
            Value: { Ref: 'UsersTable' },
        },
        DefaultUserPoolJwksUrlParameterName: {
            Value: { Ref: 'DefaultUserPoolJwksUrl' },
        },
        FeedbackSNSTopic: {
            Condition: 'BuildExamples',
            Value: { 'Fn::GetAtt': ['ExamplesStack', 'Outputs.FeedbackSNSTopic'] },
        },
        MetricsBucket: {
            Value: { Ref: 'MetricsBucket' },
        },
        TestAllBucket: {
            Value: { Ref: 'TestAllBucket' },
        },
        ContentDesignerOutputBucket:  {
            Value: { Ref: 'ContentDesignerOutputBucket' },
        },
        StreamingWebSocketEndpoint: {
            Condition: 'StreamingEnabled',
            Value: { 'Fn::GetAtt': ['StreamingStack', 'Outputs.StreamingWebSocketEndpoint'] }
        },
        SettingsTable: {
            Value: { Ref: 'SettingsTable' },
        },
    },
    Parameters: {
        OpenSearchName: {
            Type: 'String',
            Description: 'Set this to the target Amazon OpenSearch domain name to use an existing OpenSearch service. Set to \'EMPTY\' to provision a new Amazon OpenSearch service',
            Default: 'EMPTY',
            AllowedPattern: '([^ ]+)|(EMPTY)',
            ConstraintDescription: 'Must be a valid Amazon OpenSearch domain name or \'EMPTY\'',
        },
        OpenSearchInstanceType: {
            Type: 'String',
            Description:
                'OpenSearch instance type to use for the domain. Default recommendation for production deployments is m6g.large.search (see https://docs.aws.amazon.com/opensearch-service/latest/developerguide/supported-instance-types.html for other options).',
            Default: 'm6g.large.search',
            AllowedPattern: '^\\w+\\.\\w+\\.search$',
            ConstraintDescription: 'Must be a valid OpenSearch instance type',
        },
        OpenSearchFineGrainAccessControl: {
            Type: 'String',
            AllowedValues: ['FALSE', 'TRUE'],
            Description:
                'Set to FALSE if Fine-grained access control does not need to be enabled by default. Once fine-grained access control is enabled, it cannot be disabled. Please note that it may take an additional 30-60 minutes for AWS OpenSearch Service to apply these settings to the OpenSearch domain after the stack has been deployed. (see https://docs.aws.amazon.com/opensearch-service/latest/developerguide/fgac.html for additional details).',
            ConstraintDescription: 'Allowed Values are FALSE or TRUE',
            Default: 'TRUE',
        },
        AdminUserSignUp: {
            Type: 'String',
            Description: 'Set to TRUE if only the administrator is allowed to create user profiles in Amazon Cognito',
            AllowedValues: ['FALSE', 'TRUE'],
            ConstraintDescription: 'Allowed Values are FALSE or TRUE',
            Default: 'TRUE',
        },
        ApprovedDomain: {
            Type: 'String',
            Description:
                'If QnABot is private, restrict user sign up to users whos email domain matches this domain. eg. amazon.com',
            Default: '',
            AllowedPattern: '(.+\\..+)*|(NONE)|(EMPTY)',
            ConstraintDescription: 'Must be a valid domain name eg. example.com',
        },
        Email: {
            Type: 'String',
            Description:
                'Email address for the admin user. This email address will receive a temporary password to access the QnABot on AWS content designer.',
            AllowedPattern: '.+\\@.+\\..+',
            ConstraintDescription: 'Must be valid email address eg. johndoe@example.com',
        },
        Username: {
            Type: 'String',
            Description: 'This username will be used to sign in to QnABot on AWS content designer console.',
            Default: 'Admin',
            AllowedPattern: '[^ ]+',
            ConstraintDescription: 'Must not be empty or contain spaces',
        },
        KendraWebPageIndexId: {
            Type: 'String',
            Description:
                'Optional: Id of the Amazon Kendra index to use for the web crawler, a custom data source will automatically be added to the specified index. Also use this index id in AltSearchKendraIndexes to enable fallback.',
            Default: '',
            AllowedPattern: '[^ ]*',
            ConstraintDescription: 'Must be a valid Amazon Kendra index id or left blank',
        },
        KendraFaqIndexId: {
            Type: 'String',
            Description:
                'Optional: Id of the Amazon Kendra Index to use for syncing OpenSearch questions and answers',
            Default: '',
            AllowedPattern: '[^ ]*',
            ConstraintDescription: 'Must be a valid Amazon Kendra index id or left blank',
        },
        AltSearchKendraIndexes: {
            Type: 'String',
            Description:
                'Optional: A comma separated String value specifying ids of one or more Amazon Kendra indexes to be used for Kendra fallback',
            Default: '',
            AllowedPattern: '[^ ]*',
            ConstraintDescription: 'Must be a list of valid Amazon Kendra index id(s) or left blank',
        },
        AltSearchKendraIndexAuth: {
            Type: 'String',
            Description: 'Set to true if using Kendra Index(es) with access control enabled. This tells QnABot to pass an authentication token to Kendra Index(es) used for Kendra fallback if it is available.',
            AllowedValues: ['true', 'false'],
            Default: 'false',
        },
        BootstrapBucket: {
            Type: 'String',
            Description: 'Name of the S3 bucket used in bootstrapping resources',
            AllowedPattern: '[^ ]*',
            ConstraintDescription: 'Must be a valid S3 bucket name or left blank',
        },
        BootstrapPrefix: {
            Type: 'String',
            Description: 'S3 key prefix to the bootstrapping resources',
            AllowedPattern: '[^ ]*',
            ConstraintDescription: 'Must be a valid S3 key prefix or left blank',
        },
        BuildExamples: {
            Type: 'String',
            Description: 'Experimental (Development ONLY): Set to TRUE to deploy the QnABot Examples Stack. Note: Selecting FALSE will not the deploy the QnABot Examples Stack. This will limit also disable the feedback functionality and there will be no predefined examples questions set.',
            Default: 'TRUE',
            AllowedValues: ['TRUE', 'FALSE'],
        },
        PublicOrPrivate: {
            Type: 'String',
            Description:
                'Choose whether access to the QnABot client should be publicly available or restricted to users in QnABot UserPool.',
            AllowedValues: ['PUBLIC', 'PRIVATE'],
            Default: 'PRIVATE',
        },
        Language: {
            Type: 'String',
            Description: 'Choose the primary Language for your QnABot deployment. Note: Picking non-English may correspond with limited functionalities',
            AllowedValues: ['Arabic', 'Armenian', 'Basque', 'Bengali', 'Brazilian', 'Bulgarian', 'Catalan', 'Chinese', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian', 'Finnish', 'French', 'Galician', 'German', 'Greek', 'Hindi', 'Hungarian', 'Indonesian', 'Irish', 'Italian', 'Latvian', 'Lithuanian', 'Norwegian', 'Portuguese', 'Romanian', 'Russian', 'Sorani', 'Spanish', 'Swedish', 'Turkish', 'Thai'],
            Default: 'English',
        },
        OpenSearchNodeCount: {
            Type: 'String',
            Description:
                'Number of nodes in Amazon OpenSearch Service domain - \'4\' is recommended for fault tolerant production deployments.',
            AllowedValues: ['1', '2', '4'],
            Default: '4',
        },
        OpenSearchEBSVolumeSize: {
            Type: 'Number',
            Description:
                'Size in GB of each EBS volume attached to OpenSearch node instances - \'10\' is the minimum default volume size.',
            Default: 10,
            MinValue: 10,
        },
        FulfillmentConcurrency: {
            Type: 'Number',
            Description: 'The amount of provisioned concurrency for the fulfillment Lambda function - see: https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html',
            Default: 0,
            MinValue: 0,
        },
        VPCSubnetIdList: {
            Type: 'CommaDelimitedList',
            Description: 'Set to a list of Subnet IDs belonging to the target VPC you want to deploy QnABot on AWS in.',
            AllowedPattern: '[^ ]*',
            ConstraintDescription: 'Must be a list of valid subnet IDs',
            Default: '',
        },
        VPCSecurityGroupIdList: {
            Type: 'CommaDelimitedList',
            Description: 'Set to a list of Security Group IDs used by QnABot when deployed within a VPC.',
            AllowedPattern: '[^ ]*',
            ConstraintDescription: 'Must be a list of valid security group IDs',
            Default: '',
        },
        LexV2BotLocaleIds: {
            Description:
                'Languages for QnABot on AWS voice interaction using LexV2. Specify as a comma separated list of valid Locale IDs without empty spaces - see https://github.com/aws-solutions/qnabot-on-aws/blob/main/source/docs/multilanguage_support/README.md#supported-languages',
            Type: 'String',
            Default: 'en_US,es_US,fr_CA',
            AllowedPattern: '[^ ]+',
            ConstraintDescription: 'Must be a valid comma separated list of Locale IDs',
        },
        InstallLexResponseBots: {
            Description:
                'You can configure your chatbot to ask questions and process your end user\'s answers for surveys, quizzes,... (Elicit Response Feature). If the Elicit Response feature is not needed, choose \'false\' to skip the sample Lex Response Bot installation - see https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/configuring-the-chatbot-to-ask-the-questions-and-use-response-bots.html',
            Type: 'String',
            AllowedValues: ['true', 'false'],
            Default: 'true',
        },
        XraySetting: {
            Type: 'String',
            Description: 'Configure Lambdas with X-Ray enabled',
            AllowedValues: ['FALSE', 'TRUE'],
            Default: 'FALSE',
            ConstraintDescription: 'Allowed Values are FALSE or TRUE',
        },
        OpenSearchDashboardsRetentionMinutes: {
            Type: 'Number',
            Description:
                'To conserve storage in Amazon OpenSearch, metrics and feedback data used to populate the OpenSearch dashboards are automatically deleted after this period (default 43200 minutes = 30 days). Monitor \'Free storage space\' for your OpenSearch domain to ensure that you have sufficient space available to store data for the desired retention period.',
            Default: 43200,
            MinValue: 0,
        },
        EmbeddingsApi: {
            Type: 'String',
            Description:
                'Enable QnABot semantics search using Embeddings from a pre-trained Large Language Model. To use a custom LAMBDA function, provide additional parameters below.',
            AllowedValues: ['DISABLED', 'BEDROCK', 'LAMBDA'],
            Default: 'DISABLED',
        },
        EmbeddingsBedrockModelId: {
            Type: 'String',
            Description:
            'Required when EmbeddingsApi is BEDROCK. Please ensure you have requested access to the LLMs in Bedrock console (https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html), before deploying.',
            AllowedValues: [
                'amazon.titan-embed-text-v1',
                'amazon.titan-embed-text-v2',
                'cohere.embed-english-v3',
                'cohere.embed-multilingual-v3',
            ],
            Default: 'amazon.titan-embed-text-v1',
        },
        EmbeddingsLambdaArn: {
            Type: 'String',
            AllowedPattern: '^(|arn:aws:lambda:.*)$',
            Description:
                'Required when EmbeddingsApi is LAMBDA. Provide the ARN for a Lambda function that takes JSON {"inputtext":"string"}, and returns JSON {"embedding":[...]}',
            Default: '',
            ConstraintDescription: 'Must be a valid Lambda ARN or leave blank',
        },
        EmbeddingsLambdaDimensions: {
            Type: 'Number',
            MinValue: 1,
            Description:
                'Required when EmbeddingsApi is LAMBDA. Provide number of dimensions for embeddings returned by the EmbeddingsLambda function specified above.',
            Default: 1536,
        },
        LLMApi: {
            Type: 'String',
            Description:
                'Optionally enable QnABot on AWS question disambiguation and generative question answering using an LLM. Selecting the LAMBDA option allows for configuration with other LLMs.',
            AllowedValues: ['DISABLED', 'LAMBDA', 'BEDROCK'],
            Default: 'DISABLED',
        },
        LLMBedrockModelId: {
            Type: 'String',
            Description:
            'Required when LLMApi is BEDROCK. Please ensure you have requested access to the LLMs in Bedrock console (https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html), before deploying.',
            AllowedValues: [
                'amazon.nova-micro-v1',
                'amazon.nova-lite-v1',
                'amazon.nova-pro-v1',
                'amazon.titan-text-express-v1',
                'amazon.titan-text-lite-v1',
                'amazon.titan-text-premier-v1',
                'ai21.jamba-instruct-v1',
                'anthropic.claude-instant-v1',
                'anthropic.claude-v2.1',
                'anthropic.claude-3-haiku-v1',
                'anthropic.claude-3.5-haiku-v1',
                'anthropic.claude-3-sonnet-v1',
                'anthropic.claude-3.5-sonnet-v1',
                'anthropic.claude-3.5-sonnet-v2',
                'cohere.command-r-plus-v1',
                'meta.llama3-8b-instruct-v1',
                'meta.llama3.1-405b-instruct-v1',
                'mistral.mistral-large-2407-v1'
            ],
            Default: 'anthropic.claude-instant-v1',
        },
        EnableStreaming: {
            Type: 'String',
            Description: 'Set to TRUE to deploy the streaming resources using for LLMs.',
            Default: 'FALSE',
            AllowedValues: ['TRUE', 'FALSE'],
        },
        BedrockKnowledgeBaseId: {
            Type: 'String',
            Description:
                'Optional: ID of an existing Bedrock knowledge base. This setting enables the use of Bedrock knowledge bases as a fallback mechanism when a match is not found in OpenSearch.',
            AllowedPattern: '[0-9A-Z]{10}|^$',
            Default: '',
            ConstraintDescription: 'Must be a valid Bedrock knowledge base id or leave blank',
        },
        BedrockKnowledgeBaseModel: {
            Type: 'String',
            Description:
                'Required if BedrockKnowledgeBaseId is not empty. Sets the preferred LLM model to use with the Bedrock knowledge base. Please ensure you have requested access to the LLMs in Bedrock console (https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html), before deploying',
            AllowedValues: [
                'amazon.nova-micro-v1',
                'amazon.nova-lite-v1',
                'amazon.nova-pro-v1',
                'amazon.titan-text-premier-v1',
                'anthropic.claude-instant-v1',
                'anthropic.claude-v2.1',
                'anthropic.claude-3-haiku-v1',
                'anthropic.claude-3.5-haiku-v1',
                'anthropic.claude-3-sonnet-v1',
                'anthropic.claude-3.5-sonnet-v1',
                'anthropic.claude-3.5-sonnet-v2',
                'cohere.command-r-plus-v1',
                'meta.llama3.1-405b-instruct-v1',
                'mistral.mistral-large-2407-v1'
            ],
            Default: 'anthropic.claude-instant-v1',
        },
        LLMLambdaArn: {
            Type: 'String',
            AllowedPattern: '^(|arn:aws:lambda:.*)$',
            Description:
                'Required if LLMApi is LAMBDA. Provide ARN for a Lambda function that takes JSON {"prompt":"string", "settings":{key:value,..}}, and returns JSON {"generated_text":"string"}',
            Default: '',
            ConstraintDescription: 'Must be a valid Lambda ARN or leave blank',
        },
        LogRetentionPeriod: {
            Type: 'Number',
            Description: 'Optional: The number of days to keep logs before expiring. If you would like your logs to never expire, leave this value as 0.',
            Default: 0,
            AllowedValues: [
                0, 1, 3, 5, 7,  14 , 30 , 60 , 90 , 120 , 150 , 180 , 365 , 400 , 545 , 731 , 1096 , 1827 , 2192 , 2557 , 2922 , 3288 , 3653
            ],
            MinValue: 0,
        },
    },
    Conditions: {
        Public: { 'Fn::Equals': [{ Ref: 'PublicOrPrivate' }, 'PUBLIC'] },
        AdminSignUp: { 'Fn::Equals': [{ Ref: 'AdminUserSignUp' }, 'TRUE'] },
        XRAYEnabled: { 'Fn::Equals': [{ Ref: 'XraySetting' }, 'TRUE'] },
        StreamingEnabled: { 'Fn::Equals': [{ Ref: 'EnableStreaming' }, 'TRUE'] },
        FGACEnabled: { 'Fn::Equals': [{ Ref: 'OpenSearchFineGrainAccessControl' }, 'TRUE'] },
        Domain: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'ApprovedDomain' }, 'NONE'] }] },
        BuildExamples: { 'Fn::Equals': [{ Ref: 'BuildExamples' }, 'TRUE'] },
        CreateDomain: { 'Fn::Equals': [{ Ref: 'OpenSearchName' }, 'EMPTY'] },
        DontCreateDomain: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'OpenSearchName' }, 'EMPTY'] }] },
        VPCEnabled: {
            'Fn::Not': [
                {
                    'Fn::Equals': ['', { 'Fn::Join': ['', { Ref: 'VPCSecurityGroupIdList' }] }],
                },
            ],
        },
        CreateConcurrency: {
            'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'FulfillmentConcurrency' }, '0'] }],
        },
        SingleNode: { 'Fn::Equals': [{ Ref: 'OpenSearchNodeCount' }, '1'] },
        BedrockKnowledgeBaseEnable: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'BedrockKnowledgeBaseId' }, ''] }] },
        BedrockEnable: { 'Fn::Or': [{ 'Fn::Equals': [{ Ref: 'LLMApi' }, 'BEDROCK'] }, { 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'BEDROCK'] }, { Condition: 'BedrockKnowledgeBaseEnable' }] },
        EmbeddingsEnable: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'DISABLED'] }] },
        EmbeddingsBedrock: { 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'BEDROCK'] },
        EmbeddingsLambda: { 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'LAMBDA'] },
        EmbeddingsLambdaArn: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EmbeddingsLambdaArn' }, ''] }] },
        LLMEnable: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'LLMApi' }, 'DISABLED'] }] },
        LLMBedrock: { 'Fn::Equals': [{ Ref: 'LLMApi' }, 'BEDROCK'] },
        LLMLambda: { 'Fn::Equals': [{ Ref: 'LLMApi' }, 'LAMBDA'] },
        LLMLambdaArn: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'LLMLambdaArn' }, ''] }] },
        SolutionHelperSendAnonymizedDataToAWS: { 'Fn::Equals': [{ 'Fn::FindInMap': ['SolutionHelperAnonymizedData', 'SendAnonymizedData', 'Data'] }, 'Yes'] },
        KendraPluginsEnabled: {
            'Fn::Or': [
                { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'KendraWebPageIndexId' }, ''] }] },
                { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'KendraFaqIndexId' }, ''] }] },
                { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'AltSearchKendraIndexes' }, ''] }] },
            ],
        },
        LogRetentionPeriodIsNotZero: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'LogRetentionPeriod' }, 0] }] },
    },
    Rules: {
        RequireLambdaArnForLambdaEmbeddingsApi: {
            RuleCondition: {
                'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'LAMBDA'],
            },
            Assertions: [
                {
                    Assert: {
                        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EmbeddingsLambdaArn' }, ''] }],
                    },
                    AssertDescription: 'EmbeddingsLambdaArn is required when EmbeddingsApi is set to LAMBDA.',
                },
            ],
        },
    },
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
                        'OpenSearchName',
                        'OpenSearchInstanceType',
                        'OpenSearchNodeCount',
                        'OpenSearchEBSVolumeSize',
                        'OpenSearchDashboardsRetentionMinutes',
                        'OpenSearchFineGrainAccessControl',
                        'LexV2BotLocaleIds',
                        'InstallLexResponseBots',
                        'FulfillmentConcurrency',
                        'XraySetting',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2B: Set VPC parameters to deploy QnABot in an existing VPC (optional)',
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
                        'AltSearchKendraIndexAuth',
                        'BedrockKnowledgeBaseId',
                        'BedrockKnowledgeBaseModel',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2F: Set miscellaneous settings (optional)',
                    },
                    Parameters: [
                        'AdminUserSignUp',
                        'ApprovedDomain',
                        'BootstrapBucket',
                        'BootstrapPrefix',
                        'BuildExamples',
                        'LogRetentionPeriod',
                    ],
                },
            ],
        },
    },
}
