/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
