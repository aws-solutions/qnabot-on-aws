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

const fs = require('fs');
const _ = require('lodash');
const resource = require('./util/resource');
const util = require('../../util');

module.exports = {
    Static: resource('static'),
    Proxy: resource('{proxy+}', { Ref: 'Static' }),
    ProxyAnyGet: proxy({
        auth: 'NONE',
        resource: { Ref: 'Proxy' },
        method: 'get',
        path: '/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
        responseParameters: {
            'method.response.header.api-stage': 'context.stage',
        },
    }),
    ProxyAnyHead: proxy({
        auth: 'NONE',
        resource: { Ref: 'Proxy' },
        method: 'head',
        path: '/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
        responseParameters: {
            'method.response.header.api-stage': 'context.stage',
        },
    }),
    Fonts: resource('fonts', { Ref: 'Static' }),
    FontsProxy: resource('{proxy+}', { Ref: 'Fonts' }),
    FontsProxyGet: proxy({
        auth: 'NONE',
        resource: { Ref: 'FontsProxy' },
        method: 'get',
        path: '/fonts/{proxy}',
        requestParams: {
            'integration.request.path.proxy': 'method.request.path.proxy',
        },
        responseParameters: {
            'method.response.header.api-stage': 'context.stage',
        },
        contentHandling : "CONVERT_TO_BINARY"
    }),
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
                        ':s3:path/', { Ref: 'Bucket' },
                        opts.path,
                    ]],
                },
                RequestParameters: opts.requestParams || {},
                IntegrationResponses: [
                    {
                        StatusCode: 200,
                        ContentHandling: opts.contentHandling,
                        ResponseParameters: {
                            'method.response.header.content-type': 'integration.response.header.Content-Type',
                            ...opts.responseParameters,
                        },
                    }, {
                        StatusCode: 404,
                        ResponseTemplates: {
                            'application/xml': JSON.stringify({
                                error: 'Not found',
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
        Metadata: util.cfnNag(['W59']),
    };
}
