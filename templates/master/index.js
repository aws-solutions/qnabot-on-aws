/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const fs = require('fs');
const _ = require('lodash');

const files = fs
    .readdirSync(`${__dirname}`)
    .filter(
        (x) => !x.match(
            /README.md|Makefile|index|test|outputs|coverage|__snapshots__|index.test.js|jest.config.js|.DS_Store/,
        ),
    )
    .map((x) => require(`./${x}`));

module.exports = {
    Resources: _.assign.apply({}, files),
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `(SO0189-ext) QnABot with admin and client websites - Version v${process.env.npm_package_version}`,
    Mappings: {
        Solution: {
            Data: {
                ID: 'SO0189',
                Version: process.env.npm_package_version,
                AppRegistryApplicationName: 'qnabot',
                SolutionName: 'QnABot on AWS',
                ApplicationType: 'AWS-Solutions',
            },
        },
    },
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
        BotConsoleUrl: {
            Condition: 'CreateLexV1Bots',
            Value: {
                'Fn::Join': [
                    '',
                    [
                        'https://console.aws.amazon.com/lex/home?',
                        'region=',
                        { Ref: 'AWS::Region' },
                        '#bot-editor:bot=',
                        { Ref: 'LexBot' },
                    ],
                ],
            },
        },
        LexV1BotName: {
            Condition: 'CreateLexV1Bots',
            Value: { Ref: 'LexBot' },
        },
        LexV1BotAlias: {
            Condition: 'CreateLexV1Bots',
            Value: { Ref: 'VersionAlias' },
        },
        LexV1SlotType: {
            Condition: 'CreateLexV1Bots',
            Value: { Ref: 'SlotType' },
        },
        LexV1Intent: {
            Condition: 'CreateLexV1Bots',
            Value: { Ref: 'Intent' },
        },
        LexV1IntentFallback: {
            Condition: 'CreateLexV1Bots',
            Value: { Ref: 'IntentFallback' },
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
        DashboardURL: {
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
        ElasticsearchEndpoint: {
            Value: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
        },
        ElasticsearchQnAType: {
            Value: { 'Fn::GetAtt': ['Var', 'QnAType'] },
        },
        ElasticsearchQuizType: {
            Value: { 'Fn::GetAtt': ['Var', 'QuizType'] },
        },
        ElasticsearchIndex: {
            Value: { 'Fn::GetAtt': ['Var', 'index'] },
        },
        UsersTable: {
            Value: { Ref: 'UsersTable' },
        },
        DefaultSettingsSSMParameterName: {
            Value: { Ref: 'DefaultQnABotSettings' },
        },
        CustomSettingsSSMParameterName: {
            Value: { Ref: 'CustomQnABotSettings' },
        },
        DefaultUserPoolJwksUrlParameterName: {
            Value: { Ref: 'DefaultUserPoolJwksUrl' },
        },
        FeedbackSNSTopic: {
            Value: { 'Fn::GetAtt': ['ExamplesStack', 'Outputs.FeedbackSNSTopic'] },
        },
        MetricsBucket: {
            Value: { Ref: 'MetricsBucket' },
        },
    },
    Parameters: {
        ElasticsearchName: {
            Type: 'String',
            Default: 'EMPTY',
        },
        ElasticSearchInstanceType: {
            Type: 'String',
            Description:
                'OpenSearch instance type to use for the domain. Default recommendation for production deployments is m6g.large.search (see https://docs.aws.amazon.com/opensearch-service/latest/developerguide/supported-instance-types.html for other options).',
            Default: 'm6g.large.search',
            AllowedPattern: '^\\w+\\.\\w+\\.search$',
        },
        AdminUserSignUp: {
            Type: 'String',
            AllowedPattern: '(FALSE|TRUE)',
            ConstraintDescription: 'Allowed Values are FALSE or TRUE',
            Default: 'TRUE',
        },
        Encryption: {
            Type: 'String',
            Description:
                'Enables encryption at rest for S3 and ElasticSearch - recommended for production deployments.',
            AllowedValues: ['ENCRYPTED', 'UNENCRYPTED'],
            Default: 'ENCRYPTED',
            ConstraintDescription: 'Allowed Values are UNENCRYPTED or ENCRYPTED',
        },
        ApprovedDomain: {
            Type: 'String',
            Description:
                '(optional) If QnABot is private, restrict user sign up to users whos email domain matches this domain. eg. amazon.com',
            Default: 'NONE',
        },
        Email: {
            Type: 'String',
            Description:
                'Required: Email address for the admin user. Will be used for logging in and for setting the admin password. This email will receive the temporary password for the admin user.',
            AllowedPattern: '.+\\@.+\\..+',
            ConstraintDescription: 'Must be valid email address eg. johndoe@example.com',
        },
        Username: {
            Type: 'String',
            Description: 'Administrator username',
            Default: 'Admin',
        },
        DefaultKendraIndexId: {
            Type: 'String',
            Description:
                'Optional: Index ID of an existing Kendra index, used as the default index for QnABot\'s Kendra integration. You can use the QnABot Content Designer to reconfigure Kendra Index ID settings at any time.',
            Default: '',
        },
        BootstrapBucket: {
            Type: 'String',
        },
        BootstrapPrefix: {
            Type: 'String',
        },
        BuildExamples: {
            Type: 'String',
            Default: 'TRUE',
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
            Description: 'Choose the Language for your QnABot deployment. Note: Picking non-English may correspond with limited functionalities',
            AllowedValues: ['Arabic', 'Armenian', 'Basque', 'Bengali', 'Brazilian', 'Bulgarian', 'Catalan', 'Chinese', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian', 'Finnish', 'French', 'Galician', 'German', 'Greek', 'Hindi', 'Hungarian', 'Indonesian', 'Irish', 'Italian', 'Latvian', 'Lithuanian', 'Norwegian', 'Portuguese', 'Romanian', 'Russian', 'Sorani', 'Spanish', 'Swedish', 'Turkish', 'Thai'],
            Default: 'English',
        },
        ElasticSearchNodeCount: {
            Type: 'String',
            Description:
                'Number of nodes in ElasticSearch domain - \'4\' is recommended for fault tolerant production deployments.',
            AllowedValues: ['1', '2', '4'],
            Default: '4',
        },
        ElasticSearchEBSVolumeSize: {
            Type: 'Number',
            Description:
                'Size in GB of each EBS volume attached to OpenSearch node instances - \'10\' is the minimum default volume size.',
            Default: 10,
        },
        FulfillmentConcurrency: {
            Type: 'Number',
            Description: 'The amount of provisioned concurrency for the fulfillment Lambda function',
            Default: 0,
        },
        VPCSubnetIdList: {
            Type: 'CommaDelimitedList',
            Description: 'Subnet IDs',
            Default: '',
        },
        VPCSecurityGroupIdList: {
            Type: 'CommaDelimitedList',
            Description: 'Security Group IDs',
            Default: '',
        },
        LexV2BotLocaleIds: {
            Description:
                'Languages for QnABot voice interaction using LexV2. Specify as a comma separated list of valid Locale IDs without empty spaces - see https://github.com/aws-solutions/aws-qnabot/blob/main/docs/multilanguage_support/README.md#supported-languages',
            Type: 'String',
            Default: 'en_US,es_US,fr_CA',
        },
        LexBotVersion: {
            Description:
                'Lex versions to use for QnABot. Select \'LexV2 Only\' to install QnABot in AWS reqions where LexV1 is not supported.',
            Type: 'String',
            AllowedValues: ['LexV1 and LexV2', 'LexV2 Only'],
            Default: 'LexV2 Only',
        },
        InstallLexResponseBots: {
            Description:
                'If Elicit Response feature is not needed, choose \'false\' to skip sample Lex Response Bot installation.',
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
        KibanaDashboardRetentionMinutes: {
            Type: 'Number',
            Description:
                'To conserve storage in Amazon ElasticSearch, metrics and feedback data used to populate the Kibana dashboard are automatically deleted after this period (default 43200 minutes = 30 days). Monitor \'Free storage space\' for your ElasticSearch domain to ensure that you have sufficient space available to store data for the desired retention period.',
            Default: 43200,
        },
        EmbeddingsApi: {
            Type: 'String',
            Description:
                'Optionally enable (experimental) QnABot Semantics Search using Embeddings from a pre-trained Large Language Model. If set to SAGEMAKER, an ml.m5.xlarge Sagemaker endpoint is automatically provisioned with Hugging Face e5-large model. To use a custom LAMBDA function, provide additional parameters below.',
            AllowedValues: ['DISABLED', 'SAGEMAKER', 'LAMBDA'],
            Default: 'DISABLED',
        },
        SagemakerInitialInstanceCount: {
            Type: 'Number',
            MinValue: 0,
            Description:
                'Optional: If EmbeddingsApi is SAGEMAKER, provide initial instance count. Set to \'0\' to enable Serverless Inference (for cold-start delay tolerant deployments only).',
            Default: 1,
        },
        EmbeddingsLambdaArn: {
            Type: 'String',
            AllowedPattern: '^(|arn:aws:lambda:.*)$',
            Description:
                'Optional: If EmbeddingsApi is LAMBDA, provide ARN for a Lambda function that takes JSON {"inputtext":"string"}, and returns JSON {"embedding":[...]}',
            Default: '',
        },
        EmbeddingsLambdaDimensions: {
            Type: 'Number',
            MinValue: 1,
            Description:
                'Optional: If EmbeddingsApi is LAMBDA, provide number of dimensions for embeddings returned by the EmbeddingsLambda function specified above.',
            Default: 1536,
        },
        LLMApi: {
            Type: 'String',
            Description:
                'Optionally enable (experimental) QnABot question disambiguation and generative question answering using an LLM. If set to SAGEMAKER, a Sagemaker endpoint is automatically provisioned. To use a custom LAMBDA function, provide additional parameters below.',
            AllowedValues: ['DISABLED', 'SAGEMAKER', 'LAMBDA'],
            Default: 'DISABLED',
        },
        LLMSagemakerInstanceType: {
            Type: 'String',
            AllowedPattern: '^ml.*$',
            Description:
                'Optional: If LLMApi is SAGEMAKER, provide the SageMaker endpoint instance type. Defaults to ml.g5.12xlarge. Check account and region availability through the Service Quotas service before deploying',
            Default: 'ml.g5.12xlarge',
        },
        LLMSagemakerInitialInstanceCount: {
            Type: 'Number',
            MinValue: 1,
            Description:
                'Optional: If LLMApi is SAGEMAKER, provide initial instance count. Serverless Inference is not currently available for the built-in LLM model.',
            Default: 1,
        },
        LLMLambdaArn: {
            Type: 'String',
            AllowedPattern: '^(|arn:aws:lambda:.*)$',
            Description:
                'Optional: If LLMApi is LAMBDA, provide ARN for a Lambda function that takes JSON {"prompt":"string", "settings":{key:value,..}}, and returns JSON {"generated_text":"string"}',
            Default: '',
        },
    },
    Conditions: {
        Public: { 'Fn::Equals': [{ Ref: 'PublicOrPrivate' }, 'PUBLIC'] },
        Encrypted: { 'Fn::Equals': [{ Ref: 'Encryption' }, 'ENCRYPTED'] },
        AdminSignUp: { 'Fn::Equals': [{ Ref: 'AdminUserSignUp' }, 'TRUE'] },
        XRAYEnabled: { 'Fn::Equals': [{ Ref: 'XraySetting' }, 'TRUE'] },
        Domain: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'ApprovedDomain' }, 'NONE'] }] },
        BuildExamples: { 'Fn::Equals': [{ Ref: 'BuildExamples' }, 'TRUE'] },
        CreateDomain: { 'Fn::Equals': [{ Ref: 'ElasticsearchName' }, 'EMPTY'] },
        DontCreateDomain: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'ElasticsearchName' }, 'EMPTY'] }] },
        CreateLexV1Bots: { 'Fn::Equals': [{ Ref: 'LexBotVersion' }, 'LexV1 and LexV2'] },
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
        SingleNode: { 'Fn::Equals': [{ Ref: 'ElasticSearchNodeCount' }, '1'] },
        EmbeddingsEnable: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'DISABLED'] }] },
        EmbeddingsSagemaker: { 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'SAGEMAKER'] },
        EmbeddingsLambda: { 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'LAMBDA'] },
        EmbeddingsLambdaArn: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EmbeddingsLambdaArn' }, ''] }] },
        LLMEnable: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'LLMApi' }, 'DISABLED'] }] },
        LLMSagemaker: { 'Fn::Equals': [{ Ref: 'LLMApi' }, 'SAGEMAKER'] },
        LLMLambda: { 'Fn::Equals': [{ Ref: 'LLMApi' }, 'LAMBDA'] },
        LLMLambdaArn: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'LLMLambdaArn' }, ''] }] },
    },
};
