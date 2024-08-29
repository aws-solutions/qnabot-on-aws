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
const util = require('../../util');

module.exports = {
    LexBuildLambdaLogGroup:{
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-LexBuildLambda' },
                        { 'Fn::Select': ['2', { 'Fn::Split': ['/', { Ref: 'AWS::StackId' }] }] },
                    ],
                ],
            },
            RetentionInDays: {
                'Fn::If': [
                    'LogRetentionPeriodIsNotZero',
                    { Ref: 'LogRetentionPeriod' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
        },
        Metadata: {
            guard: util.cfnGuard('CLOUDWATCH_LOG_GROUP_ENCRYPTED', 'CW_LOGGROUP_RETENTION_PERIOD_CHECK'),
        },
    },
    LexBuildLambda: lambda({
        S3Bucket: { Ref: 'BootstrapBucket' },
        S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/lex-build.zip' },
        S3ObjectVersion: { Ref: 'LexBuildCodeVersion' },
    }, {
        UTTERANCE_BUCKET: { Ref: 'AssetBucket' },
        UTTERANCE_KEY: 'default-utterances.json',
        POLL_LAMBDA: { 'Fn::GetAtt': ['LexBuildLambdaPoll', 'Arn'] },
        STATUS_BUCKET: { Ref: 'BuildStatusBucket' },
        LEXV2_STATUS_KEY: 'lexV2status.json',
        LEXV2_BUILD_LAMBDA: { Ref: 'Lexv2BotLambda' },
        ADDRESS: { 'Fn::Join': ['', ['https://', { 'Fn::GetAtt': ['ESVar', 'ESAddress'] }]] },
        INDEX: { 'Fn::GetAtt': ['Var', 'index'] },
        ...util.getCommonEnvironmentVariables(),
    }, process.env.npm_package_config_lambdaRuntime,
    {
        LogGroup: { Ref: 'LexBuildLambdaLogGroup' },
    },
    ),
    LexBuildLambdaStartLogGroup:{
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-LexBuildLambdaStart' },
                        { 'Fn::Select': ['2', { 'Fn::Split': ['/', { Ref: 'AWS::StackId' }] }] },
                    ],
                ],
            },
            RetentionInDays: {
                'Fn::If': [
                    'LogRetentionPeriodIsNotZero',
                    { Ref: 'LogRetentionPeriod' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
        },
        Metadata: {
            guard: util.cfnGuard('CLOUDWATCH_LOG_GROUP_ENCRYPTED', 'CW_LOGGROUP_RETENTION_PERIOD_CHECK'),
        },
    },
    LexBuildLambdaStart: lambda({
        ZipFile: fs.readFileSync(`${__dirname}/start.js`, 'utf8'),
    }, {
        STATUS_BUCKET: { Ref: 'BuildStatusBucket' },
        LEXV2_STATUS_KEY: 'lexV2status.json',
        BUILD_FUNCTION: { 'Fn::GetAtt': ['LexBuildLambda', 'Arn'] },
        ...util.getCommonEnvironmentVariables(),
    }, process.env.npm_package_config_lambdaRuntime,
    {
        LogGroup: { Ref: 'LexBuildLambdaStartLogGroup' },
    }),
    LexBuildLambdaPollLogGroup:{
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-LexBuildLambdaPoll' },
                        { 'Fn::Select': ['2', { 'Fn::Split': ['/', { Ref: 'AWS::StackId' }] }] },
                    ],
                ],
            },
            RetentionInDays: {
                'Fn::If': [
                    'LogRetentionPeriodIsNotZero',
                    { Ref: 'LogRetentionPeriod' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
        },
        Metadata: {
            guard: util.cfnGuard('CLOUDWATCH_LOG_GROUP_ENCRYPTED', 'CW_LOGGROUP_RETENTION_PERIOD_CHECK'),
        },
    },
    LexBuildLambdaPoll: lambda({
        ZipFile: fs.readFileSync(`${__dirname}/poll.js`, 'utf8'),
    }, {
        STATUS_BUCKET: { Ref: 'BuildStatusBucket' },
        ...util.getCommonEnvironmentVariables(),
    }, process.env.npm_package_config_lambdaRuntime,
    {
        LogGroup: { Ref: 'LexBuildLambdaPollLogGroup' },
    }),
    LexBuildCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/lex-build.zip' },
            BuildDate: (new Date()).toISOString(),
        },
    },
    LexBuildInvokePolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Properties: {
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Action: [
                        'lambda:InvokeFunction',
                    ],
                    Resource: [
                        { 'Fn::GetAtt': ['LexBuildLambda', 'Arn'] },
                        { 'Fn::GetAtt': ['LexBuildLambdaPoll', 'Arn'] },
                        { 'Fn::GetAtt': ['Lexv2BotLambda', 'Arn'] },
                    ],
                }],
            },
            Roles: [{ Ref: 'LexBuildLambdaRole' }],
        },
    },
    LexBuildLambdaRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            },
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
                util.lexFullAccess(),
                {
                    PolicyName: 'AssetBucketAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Action: ['s3:Get*'],
                            Resource: [
                                { 'Fn::Sub': 'arn:aws:s3:::${AssetBucket}*' },
                                { 'Fn::Sub': 'arn:aws:s3:::${BuildStatusBucket}*' },
                            ],
                        }, {
                            Effect: 'Allow',
                            Action: ['s3:Put*'],
                            Resource: [
                                { 'Fn::Sub': 'arn:aws:s3:::${BuildStatusBucket}*' },
                            ],
                        }],
                    },
                }],
            Path: '/',
            ManagedPolicyArns: [
                { Ref: 'QueryPolicy' },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12', 'W76', 'F3']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
    BuildStatusBucket: {
        Type: 'AWS::S3::Bucket',
        Metadata: { guard: util.cfnGuard('S3_BUCKET_NO_PUBLIC_RW_ACL') },
        DependsOn : ['MainAccessLogBucket', 'MainAccessLogsBucketPolicy'],
        Properties: {
            LifecycleConfiguration: {
                Rules: [{
                    NoncurrentVersionExpirationInDays: 1,
                    Status: 'Enabled',
                }, {
                    AbortIncompleteMultipartUpload: {
                        DaysAfterInitiation: 1,
                    },
                    Status: 'Enabled',
                }],
            },
            VersioningConfiguration: {
                Status: 'Enabled',
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
            LoggingConfiguration: {
                DestinationBucketName: { Ref: 'MainAccessLogBucket' },
                LogFilePrefix: {"Fn::Join": ["", [{Ref: 'MainAccessLogBucket'},"/BuildStatus/"]]},
            },
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'AES256',
                    },
                }],
            },
        },
    },
    HTTPSOnlyBuildStatusBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
            Bucket: {
                Ref: 'BuildStatusBucket',
            },
            PolicyDocument: {
                Statement: [
                    {
                        Action: '*',
                        Condition: {
                            Bool: {
                                'aws:SecureTransport': 'false',
                            },
                        },
                        Effect: 'Deny',
                        Principal: '*',
                        Resource: [
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [
                                                'BuildStatusBucket',
                                                'Arn',
                                            ],
                                        },
                                        '/*',
                                    ],
                                ],
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': [
                                                'BuildStatusBucket',
                                                'Arn',
                                            ],
                                        },
                                    ],
                                ],
                            },
                        ],
                        Sid: 'HttpsOnly',
                    },
                ],
                Version: '2012-10-17',
            },
        },
        Metadata: {
            'aws:cdk:path': 'serverless-bot-framework/CloudfrontStaticWebsite/CloudFrontToS3/S3LoggingBucket/Policy/Resource',
        },
    },
    BuildStatusClean: {
        Type: 'Custom::S3Clean',
        DependsOn: ['CFNInvokePolicy', 'HTTPSOnlyBuildStatusBucketPolicy'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
            Bucket: { Ref: 'BuildStatusBucket' },
        },
    },
};

function lambda(code, variable, runtime, loggingConfig) {
    return {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: code,
            Environment: {
                Variables: variable,
            },
            Handler: 'index.handler',
            LoggingConfig: loggingConfig,
            MemorySize: '1024',
            Role: { 'Fn::GetAtt': ['LexBuildLambdaRole', 'Arn'] },
            Runtime: runtime,
            Timeout: 900,
            VpcConfig: {
                'Fn::If': ['VPCEnabled', {
                    SubnetIds: { Ref: 'VPCSubnetIdList' },
                    SecurityGroupIds: { Ref: 'VPCSecurityGroupIdList' },
                }, { Ref: 'AWS::NoValue' }],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' },
                    { Ref: 'AWS::NoValue' }],
            },
            Layers: [
                { Ref: 'AwsSdkLayerLambdaLayer' },
                { Ref: 'CommonModulesLambdaLayer' },
            ],
            Tags: [{
                Key: 'Type',
                Value: 'Api',
            }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    };
}
