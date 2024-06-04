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

const date = new Date();
module.exports = {
    Var: {
        Type: 'Custom::Variable',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            index: {
                value: { Ref: 'AWS::StackName' },
                op: 'toLowerCase',
            },
            QnAType: 'qna',
            QuizType: 'quiz',
            QnaIndex: {
                value: { 'Fn::Sub': '${AWS::StackName}' },
                op: 'toLowerCase',
            },
            MetricsIndex: {
                value: { 'Fn::Sub': '${AWS::StackName}-metrics' },
                op: 'toLowerCase',
            },
            FeedbackIndex: {
                value: { 'Fn::Sub': '${AWS::StackName}-feedback' },
                op: 'toLowerCase',
            },
        },
    },
    InfoVar: {
        Type: 'Custom::Variable',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Version: require('../../package.json').version,
            BuildDateString: `${date.toDateString()} ${date.toTimeString()}`,
            BuildDate: date,
        },
    },
    ESVar: {
        Type: 'Custom::Variable',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            ESArn: {
                'Fn::If': [
                    'CreateDomain',
                    { 'Fn::GetAtt': ['OpensearchDomain', 'DomainArn'] },
                    { 'Fn::GetAtt': ['ESInfo', 'Arn'] },
                ],
            },
            ESAddress: {
                'Fn::If': [
                    'CreateDomain',
                    { 'Fn::GetAtt': ['OpensearchDomain', 'DomainEndpoint'] },
                    { 'Fn::GetAtt': ['ESInfo', 'Endpoint'] },
                ],
            },
            ESDomain: {
                'Fn::If': [
                    'CreateDomain',
                    { Ref: 'OpensearchDomain' },
                    { Ref: 'OpenSearchName' },
                ],
            },
        },
    },
    ApiUrl: {
        Type: 'Custom::Variable',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Name: {
                'Fn::Join': ['', [
                    'https://',
                    { Ref: 'API' },
                    '.execute-api.',
                    { Ref: 'AWS::Region' },
                    '.amazonaws.com/prod',
                ]],
            },
        },
    },
    Urls: {
        Type: 'Custom::Variable',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Designer: {
                'Fn::Join': ['', [
                    { 'Fn::GetAtt': ['ApiUrl', 'Name'] },
                    '/static/index.html',
                ]],
            },
            Client: {
                'Fn::Join': ['', [
                    { 'Fn::GetAtt': ['ApiUrl', 'Name'] },
                    '/static/client.html',
                ]],
            },
            OpenSearchDashboards: { 'Fn::Sub': '${ESVar.ESAddress}/_dashboards/app/dashboards#/list' },
        },
    },
};
