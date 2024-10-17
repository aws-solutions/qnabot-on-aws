/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const clean = require('clean-deep');

const _ = require('lodash');

module.exports = function (params) {
    return clean({
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: params.authorization || 'NONE',
            AuthorizerId: params.authorizerId,
            HttpMethod: params.method.toUpperCase(),
            Integration: {
                Type: 'AWS',
                IntegrationHttpMethod: 'POST',
                Uri: {
                    'Fn::Join': ['', [
                        'arn:aws:apigateway:',
                        { Ref: 'AWS::Region' },
                        ':lambda:path/2015-03-31/functions/',
                        params.lambda || {
                            'Fn::Join': [':', [
                                { 'Fn::GetAtt': ['FulfillmentLambda', 'Arn'] },
                                'live',
                            ]],
                        },
                        '/invocations',
                    ]],
                },
                IntegrationResponses: _.concat({
                    StatusCode: params.defaultResponse || 200,
                    ResponseParameters: params.responseParameters,
                    ResponseTemplates: {
                        'application/json': { 'Fn::Sub': params.responseTemplate },
                    },
                }, {
                    SelectionPattern: '.*[InternalServiceError].*',
                    StatusCode: 500,
                    ResponseTemplates: {
                        'application/json': fs.readFileSync(`${__dirname}/../error/error.vm`, 'utf8'),
                    },
                }, {
                    SelectionPattern: '.*[BadRequest].*',
                    StatusCode: 400,
                    ResponseTemplates: {
                        'application/json': fs.readFileSync(`${__dirname}/../error/error.vm`, 'utf8'),
                    },
                }, {
                    SelectionPattern: '.*[Conflict].*',
                    StatusCode: 409,
                    ResponseTemplates: {
                        'application/json': fs.readFileSync(`${__dirname}/../error/error.vm`, 'utf8'),
                    },
                }, {
                    SelectionPattern: '.*[NotFound].*',
                    StatusCode: 404,
                    ResponseTemplates: {
                        'application/json': fs.readFileSync(`${__dirname}/../error/error.vm`, 'utf8'),
                    },
                },
                {
                    SelectionPattern: '.*Exception.*',
                    StatusCode: 405,
                    ResponseTemplates: {
                        'application/json': fs.readFileSync(`${__dirname}/../error/error.vm`, 'utf8'),
                    },
                }),
                RequestParameters: params.parameterNames,
                RequestTemplates: {
                    'application/json': params.subTemplate
                        ? { 'Fn::Sub': params.subTemplate }
                        : params.template,
                },
            },
            RequestModels: params.models,
            RequestParameters: params.parameterLocations,
            ResourceId: params.resource,
            MethodResponses: [
                {
                    StatusCode: params.defaultResponse || 200,
                    ResponseParameters: { 'method.response.header.date': true, ..._.mapValues(params.responseParameters, (x) => false) },
                },
                {
                    StatusCode: 404,
                },
                {
                    StatusCode: 405,
                },
                {
                    StatusCode: 500,
                },
            ],
            RestApiId: { Ref: 'API' },
        },
    }, {
        emptyStrings: false,
    });
};
