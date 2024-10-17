/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
                                Value: 'status-export',
                            }],
                        },
                    },
                }
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
    KendraSyncS3Trigger: {
        Type: 'Custom::S3Lambda',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'ContentDesignerOutputBucket' },
            NotificationConfiguration: {
                LambdaFunctionConfigurations: [{
                    LambdaFunctionArn: { 'Fn::GetAtt': ['KendraSyncLambda', 'Arn'] },
                    Events: ['s3:ObjectCreated:*'],
                    Filter: {
                        Key: {
                            FilterRules: [{
                                Name: 'prefix',
                                Value: 'kendra-data-export',
                            }],
                        },
                    },
                },
                ],
            },
        },
    },    
    KendraSyncPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: { 'Fn::GetAtt': ['KendraSyncLambda', 'Arn'] },
            Action: 'lambda:InvokeFunction',
            Principal: 's3.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' },
            SourceArn: { 'Fn::Sub': 'arn:aws:s3:::${ContentDesignerOutputBucket}' },
        },
    },

};
