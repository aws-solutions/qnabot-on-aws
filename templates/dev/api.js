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

const util = require('../util');

module.exports = {
    Description: 'This template creates dev ApiGateway',
    Resources: {
        API: {
            Type: 'AWS::ApiGateway::RestApi',
            Properties: {
                Name: 'test',
            },
        },
        get: {
            Type: 'AWS::ApiGateway::Method',
            Properties: {
                HttpMethod: 'GET',
                AuthorizationType: 'NONE',
                Integration: {
                    Type: 'MOCK',
                    IntegrationResponses: [{
                        ResponseTemplates: {
                            'application/json': '{}',
                        },
                        StatusCode: '200',
                    }],
                    RequestTemplates: {
                        'application/json': '{"statusCode": 200}',
                    },
                },
                ResourceId: { 'Fn::GetAtt': ['API', 'RootResourceId'] },
                MethodResponses: [{ StatusCode: 200 }],
                RestApiId: { Ref: 'API' },
            },
        },
        Deployment: {
            Type: 'AWS::ApiGateway::Deployment',
            Properties: {
                RestApiId: { Ref: 'API' },
            },
            DependsOn: 'get',
        },
        Stage: {
            Type: 'AWS::ApiGateway::Stage',
            Properties: {
                DeploymentId: { Ref: 'Deployment' },
                RestApiId: { Ref: 'API' },
                StageName: 'test',
            },
            Metadata: util.cfnNag(['W64', 'W69']),
        },
    },
    Outputs: {
        ApiId: {
            Value: { Ref: 'API' },
        },
        Stage: {
            Value: 'test',
        },
    },
};
