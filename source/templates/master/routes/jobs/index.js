/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const _ = require('lodash');
const resource = require('../util/resource');
const lambda = require('../util/lambda');
const mock = require('../util/mock');
const util = require('../../../util');

module.exports = {
    Jobs: resource('jobs'),
    JobsGet: mock({
        auth: 'AWS_IAM',
        method: 'GET',
        subTemplate: 'jobs/info',
        resource: { Ref: 'Jobs' },
    }),
    testalls: resource('testall', { Ref: 'Jobs' }),
    testallsList: lambda({
        authorization: 'AWS_IAM',
        method: 'get',
        lambda: { 'Fn::GetAtt': ['S3ListLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/list-testall.vm`, 'utf8'),
        resource: { Ref: 'testalls' },
        parameterLocations: {
            'method.request.querystring.perpage': false,
            'method.request.querystring.token': false,
        },
    }),
    testall: resource('{proxy+}', { Ref: 'testalls' }),
    testallPut: proxy({
        resource: { Ref: 'testall' },
        auth: 'AWS_IAM',
        method: 'PUT',
        bucket: { Ref: 'TestAllBucket' },
        path: '/status-testall/{proxy}',
        template: fs.readFileSync(`${__dirname}/testall-start.vm`, 'utf-8'),
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
    }),
    testallGet: proxy({
        resource: { Ref: 'testall' },
        auth: 'AWS_IAM',
        method: 'GET',
        bucket: { Ref: 'ContentDesignerOutputBucket' },
        path: '/status-testall/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
    }),
    testallDelete: proxy({
        resource: { Ref: 'testall' },
        auth: 'AWS_IAM',
        method: 'delete',
        bucket: { Ref: 'ContentDesignerOutputBucket' },
        path: '/status-testall/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
    }),
    exports: resource('exports', { Ref: 'Jobs' }),
    exportsList: lambda({
        authorization: 'AWS_IAM',
        method: 'get',
        lambda: { 'Fn::GetAtt': ['S3ListLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/list-export.vm`, 'utf8'),
        resource: { Ref: 'exports' },
        parameterLocations: {
            'method.request.querystring.perpage': false,
            'method.request.querystring.token': false,
        },
    }),
    export: resource('{proxy+}', { Ref: 'exports' }),
    imports: resource('imports', { Ref: 'Jobs' }),
    exportPut: proxy({
        resource: { Ref: 'export' },
        auth: 'AWS_IAM',
        method: 'PUT',
        bucket: { Ref: 'ExportBucket' },
        path: '/status-export/{proxy}',
        template: fs.readFileSync(`${__dirname}/export-start.vm`, 'utf-8'),
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
    }),
    exportGet: proxy({
        resource: { Ref: 'export' },
        auth: 'AWS_IAM',
        method: 'GET',
        bucket: { Ref: 'ContentDesignerOutputBucket' },
        path: '/status-export/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
    }),
    exportDelete: proxy({
        resource: { Ref: 'export' },
        auth: 'AWS_IAM',
        method: 'delete',
        bucket: { Ref: 'ContentDesignerOutputBucket' },
        path: '/status/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
    }),
    importsList: lambda({
        authorization: 'AWS_IAM',
        method: 'get',
        lambda: { 'Fn::GetAtt': ['S3ListLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/list.vm`, 'utf8'),
        resource: { Ref: 'imports' },
        parameterLocations: {
            'method.request.querystring.perpage': false,
            'method.request.querystring.token': false,
        },
    }),
    import: resource('{proxy+}', { Ref: 'imports' }),
    importGet: proxy({
        resource: { Ref: 'import' },
        auth: 'AWS_IAM',
        method: 'get',
        bucket: { Ref: 'ContentDesignerOutputBucket' },
        path: '/status-import/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
    }),
    importDelete: proxy({
        resource: { Ref: 'import' },
        auth: 'AWS_IAM',
        method: 'delete',
        bucket: { Ref: 'ContentDesignerOutputBucket' },
        path: '/status-import/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
    }),
    S3ListLambdaLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-S3ListLambda' },
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
    S3ListLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                ZipFile: fs.readFileSync(`${__dirname}/handler.js`, 'utf8'),
            },
            Environment: {
                Variables: {
                    ...util.getCommonEnvironmentVariables()
                }
            },
            Handler: 'index.handler',
            LoggingConfig: {
                LogGroup: { Ref: 'S3ListLambdaLogGroup' },
            },
            MemorySize: '128',
            Role: { 'Fn::GetAtt': ['S3ListLambdaRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
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
    },
    S3ListLambdaRole: {
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
            Path: '/',
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
                {
                    PolicyName: 'S3ListPolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: ['S3:List*'],
                                Resource: [{ 'Fn::Sub': 'arn:${AWS::Partition}:s3:::*' }],
                            },
                        ],
                    },
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
};

function proxy(opts) {
    return {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: opts.auth || 'AWS_IAM',
            HttpMethod: opts.method.toUpperCase(),
            Integration: _.pickBy({
                Type: 'AWS',
                IntegrationHttpMethod: opts.method.toUpperCase(),
                Credentials: { 'Fn::GetAtt': ['S3AccessRole', 'Arn'] },
                Uri: {
                    'Fn::Join': ['', [
                        'arn:aws:apigateway:',
                        { Ref: 'AWS::Region' },
                        ':s3:path/', opts.bucket,
                        opts.path,
                    ]],
                },
                RequestParameters: opts.requestParams || {},
                RequestTemplates: opts.template ? {
                    'application/json': { 'Fn::Sub': opts.template },
                } : null,
                IntegrationResponses: [
                    {
                        StatusCode: 200,
                        ResponseParameters: {
                            'method.response.header.content-type': 'integration.response.header.Content-Type',
                            ...opts.responseParameters,
                        },
                    }, {
                        StatusCode: 404,
                        ResponseTemplates: {
                            'application/xml': JSON.stringify({
                                error: 'Job not found',
                            }),
                        },
                        SelectionPattern: '403',
                    },
                ],
            }),
            RequestParameters: {
                'method.request.path.proxy': false,
            },
            ResourceId: opts.resource,
            MethodResponses: [
                {
                    StatusCode: 200,
                    ResponseParameters: {
                        'method.response.header.content-type': false,
                        ..._.mapValues(opts.responseParameters || {}, (x) => false),
                    },
                },
                { StatusCode: 400 },
                { StatusCode: 404 },
            ],
            RestApiId: { Ref: 'API' },
        },
    };
}
