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

const _ = require('lodash');

const methods = [];
_.forEach(require('./routes'), (value, key) => {
    value.Type === 'AWS::ApiGateway::Method' ? methods.push(key) : null;  // NOSONAR used iterative expression
});
const permissions = _.keys(require('./lambda'))
    .filter((x) => x.match(/^InvokePermission/))
    .filter((x) => ![
        'InvokePermissionLexBuildLambda',
        'InvokePermissionLexBuildLambdaPoll',
        'InvokePermissionLexStatusLambda',
    ].includes(x));

const util = require('../util');

module.exports = {
    API: {
        Type: 'AWS::ApiGateway::RestApi',
        Properties: {
            Name: { Ref: 'AWS::StackName' },
            Description: 'An Api interface for the admin actions on the QNA bot',
            BinaryMediaTypes: ['image/png', 'font/woff', 'font/woff2'],
            MinimumCompressionSize: 500000,
        },
    },
    Deployment: {
        Type: 'Custom::ApiDeployment',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            restApiId: { Ref: 'API' },
            buildDate: new Date(),
            stage: 'prod',
            Encryption: { Ref: 'Encryption' },
            LexV2BotLocaleIds: { Ref: 'LexV2BotLocaleIds' },
        },
        DependsOn: methods.concat(permissions),
    },
    Stage: stage('prod'),
    ApiGatewayAccount: {
        Type: 'AWS::ApiGateway::Account',
        Properties: {
            CloudWatchRoleArn: {
                'Fn::GetAtt': ['ApiGatewayCloudWatchLogsRole', 'Arn'],
            },
        },
    },
    DocumentationVersion: {
        Type: 'AWS::ApiGateway::DocumentationVersion',
        DependsOn: ['BotDoc'],
        Properties: {
            Description: '',
            DocumentationVersion: '1.0',
            RestApiId: { Ref: 'API' },
        },
    },
};

function stage(name) {
    return {
        Type: 'AWS::ApiGateway::Stage',
        Properties: {
            DeploymentId: {
                Ref: 'Deployment',
            },
            RestApiId: {
                Ref: 'API',
            },
            StageName: name,
            MethodSettings: [{
                DataTraceEnabled: true,
                HttpMethod: '*',
                LoggingLevel: 'INFO',
                ResourcePath: '/*',
            }],
            Variables: {
                Id: 'QnABot',
                Region: { Ref: 'AWS::Region' },
                CognitoEndpoint: { 'Fn::GetAtt': ['DesignerLogin', 'Domain'] },
                DesignerLoginUrl: {
                    'Fn::Join': ['', [
                        { 'Fn::GetAtt': ['ApiUrl', 'Name'] },
                        '/pages/designer',
                    ]],
                },
                ClientLoginUrl: {
                    'Fn::If': [
                        'Public',
                        { 'Fn::GetAtt': ['Urls', 'Client'] },
                        {
                            'Fn::Join': ['', [
                                { 'Fn::GetAtt': ['ApiUrl', 'Name'] },
                                '/pages/client',
                            ]],
                        },
                    ],
                },
            },
        },
        Metadata: util.cfnNag(['W64', 'W69']),
    };
}
