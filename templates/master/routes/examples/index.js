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
const resource = require('../util/resource');
const lambda = require('../util/lambda');
const mock = require('../util/mock');
const util = require('../../../util');

module.exports = {
    Examples: resource('examples'),
    ExamplesGet: mock({
        authorization: 'AWS_IAM',
        method: 'GET',
        subTemplate: 'examples/info',
        resource: { Ref: 'Examples' },
    }),
    photos: resource('photos', { Ref: 'Examples' }),
    photosList: lambda({
        authorization: 'AWS_IAM',
        method: 'get',
        lambda: { 'Fn::GetAtt': ['ExampleS3ListPhotoLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/photos.vm`, 'utf8'),
        resource: { Ref: 'photos' },
        parameterLocations: {
            'method.request.querystring.perpage': false,
            'method.request.querystring.token': false,
        },
    }),
    photo: resource('{proxy+}', { Ref: 'photos' }),
    photoGet: proxy({
        resource: { Ref: 'photo' },
        method: 'get',
        bucket: { Ref: 'AssetBucket' },
        path: '/examples/photos/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
        authorization: 'AWS_IAM',
    }),
    Documents: resource('documents', { Ref: 'Examples' }),
    DocumentsList: lambda({
        authorization: 'AWS_IAM',
        method: 'get',
        lambda: { 'Fn::GetAtt': ['ExampleS3ListLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/list.vm`, 'utf8'),
        resource: { Ref: 'Documents' },
        parameterLocations: {
            'method.request.querystring.perpage': false,
            'method.request.querystring.token': false,
        },
    }),
    Example: resource('{proxy+}', { Ref: 'Documents' }),
    ExampleGet: proxy({
        authorization: 'AWS_IAM',
        resource: { Ref: 'Example' },
        method: 'get',
        bucket: { Ref: 'AssetBucket' },
        path: '/examples/documents/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
    }),
    ExampleHead: proxy({
        resource: { Ref: 'Example' },
        method: 'head',
        bucket: { Ref: 'AssetBucket' },
        path: '/examples/documents/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
        authorization: 'AWS_IAM',
    }),
    ExampleS3ListLambda: {
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
            Handler: 'index.documents',
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
        Metadata: util.cfnNag(['W92']),
    },
    ExampleS3ListPhotoLambda: {
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
            Handler: 'index.photos',
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
        Metadata: util.cfnNag(['W92']),
    },
};

function proxy(opts) {
    return {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: opts.auth || 'AWS_IAM',
            HttpMethod: opts.method.toUpperCase(),
            Integration: {
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
                                error: opts.missingMessage || 'Not Found',
                            }),
                        },
                        SelectionPattern: '403',
                    },
                ],
            },
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
