/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('../../../util');

module.exports = function (url, resource) {
    return {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: 'NONE',
            HttpMethod: 'GET',
            Integration: {
                Type: 'MOCK',
                IntegrationResponses: [{
                    ResponseParameters: {
                        'method.response.header.location': {
                            'Fn::Join': ['', [
                                '\'', url, '\'',
                            ]],
                        },
                    },
                    StatusCode: '302',
                }],
                RequestTemplates: {
                    'application/json': '{"statusCode": 302}',
                },
            },
            ResourceId: resource,
            MethodResponses: [{
                StatusCode: 302,
                ResponseParameters: {
                    'method.response.header.location': true,
                },
            }],
            RestApiId: { Ref: 'API' },
        },
        Metadata: { cfn_nag: util.cfnNag(['W59']) },
    };
};
