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

module.exports = {
    Description: 'This template creates dev ElasticSearch Cluster',
    Resources: {
        Role: {
            Type: 'AWS::IAM::Role',
            Properties: {
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Federated: 'cognito-identity.amazonaws.com',
                            },
                            Action: 'sts:AssumeRoleWithWebIdentity',
                            Condition: {
                                StringEquals: {
                                    'cognito-identity.amazonaws.com:aud': { Ref: 'IdPool' },
                                },
                            },
                        },
                    ],
                },
                Path: '/',
            },
        },
        IdPool: {
            Type: 'AWS::Cognito::IdentityPool',
            Properties: {
                IdentityPoolName: 'UserPool',
                AllowUnauthenticatedIdentities: true,
                CognitoIdentityProviders: [
                    {
                        ClientId: {
                            Ref: 'Client',
                        },
                        ProviderName: {
                            'Fn::GetAtt': [
                                'UserPool',
                                'ProviderName',
                            ],
                        },
                        ServerSideTokenCheck: true,
                    },
                ],
            },
        },
        UserPool: {
            Type: 'AWS::Cognito::UserPool',
            Properties: {
                UserPoolName: { 'Fn::Join': ['-', ['UserPool', { Ref: 'AWS::StackName' }]] },
            },
        },
        Client: {
            Type: 'AWS::Cognito::UserPoolClient',
            Properties: {
                ClientName: { 'Fn::Join': ['-', ['UserPool', { Ref: 'AWS::StackName' }]] },
                GenerateSecret: false,
                UserPoolId: { Ref: 'UserPool' },
            },
        },
    },
    Outputs: {
        IdPool: {
            Value: { Ref: 'IdPool' },
        },
        UserPool: {
            Value: { Ref: 'UserPool' },
        },
        Client: {
            Value: { Ref: 'Client' },
        },
        Role: {
            Value: { 'Fn::GetAtt': ['Role', 'Arn'] },
        },
    },
};
