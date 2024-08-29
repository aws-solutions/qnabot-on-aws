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

const config = require('./config');

// must change this version to force upgrades to reapply across the entire Bot echo system
const qnabotversion = `${process.env.npm_package_version} - v1`;

module.exports = {
    QNAInvokePermission: {
        Type: 'AWS::Lambda::Permission',
        DependsOn: 'FulfillmentLambdaAliaslive',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: {
                'Fn::Join': [':', [
                    { 'Fn::GetAtt': ['FulfillmentLambda', 'Arn'] },
                    'live',
                ]],
            },
            Principal: 'lex.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' }, 
        },
    },
    LexV2Bot: {
        Type: 'Custom::LexV2Bot',
        Properties: {
            ServiceToken: {
                'Fn::GetAtt': [
                    'Lexv2BotLambda',
                    'Arn',
                ],
            },
            description: `QnABot LexV2 Bot${qnabotversion}`,
            BuildDate: (new Date()).toISOString(),
            localIds: { Ref: 'LexV2BotLocaleIds' },
            utterances: config.utterances,
        },
    },
};
