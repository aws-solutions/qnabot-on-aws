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
