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
const util = require('../../../util');

module.exports = function (opts) {
    return {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: opts.auth || 'AWS_IAM',
            HttpMethod: opts.method,
            Integration: {
                Type: 'MOCK',
                IntegrationResponses: [{
                    ResponseTemplates: {
                        'application/json': opts.subTemplate
                            ? {
                                'Fn::Sub': fs.readFileSync(
                                    `${__dirname}/../${opts.subTemplate}.vm`,
                                    'utf8',
                                ),
                            }
                            : fs.readFileSync(
                                `${__dirname}/../${opts.template}.vm`,
                                'utf8',
                            ),
                    },
                    StatusCode: '200',
                }],
                RequestTemplates: {
                    'application/json': '{"statusCode": 200}',
                },
            },
            ResourceId: opts.resource,
            MethodResponses: [{ StatusCode: 200 }],
            RestApiId: { Ref: 'API' },
        },
        Metadata: util.cfnNag(['W59']),
    };
};
