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
    ExportTriggerFromS3: {
        Type: 'Custom::S3Lambda',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'ExportBucket' },
            NotificationConfiguration: {
                LambdaFunctionConfigurations: [{
                    LambdaFunctionArn: { 'Fn::GetAtt': ['ExportStepLambda', 'Arn'] },
                    Events: ['s3:ObjectCreated:*'],
                    Filter: {
                        Key: {
                            FilterRules: [{
                                Name: 'prefix',
                                Value: 'status',
                            }],
                        },
                    },
                }, {
                    LambdaFunctionArn: { 'Fn::GetAtt': ['KendraSyncLambda', 'Arn'] },
                    Events: ['s3:ObjectCreated:*'],
                    Filter: {
                        Key: {
                            FilterRules: [{
                                Name: 'prefix',
                                Value: 'kendra-data',
                            }],
                        },
                    },
                },
                ],
            },
        },
    },
    ExportStepPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: { 'Fn::GetAtt': ['ExportStepLambda', 'Arn'] },
            Action: 'lambda:InvokeFunction',
            Principal: 's3.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' },
            SourceArn: { 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}' },
        },
    },
    KendraSyncPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: { 'Fn::GetAtt': ['KendraSyncLambda', 'Arn'] },
            Action: 'lambda:InvokeFunction',
            Principal: 's3.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' },
            SourceArn: { 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}' },
        },
    },

};
