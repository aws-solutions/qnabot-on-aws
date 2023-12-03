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

module.exports = {
    ImportTriggerFromS3: {
        Type: 'Custom::S3Lambda',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'ImportBucket' },
            NotificationConfiguration: {
                LambdaFunctionConfigurations: [{
                    LambdaFunctionArn: { 'Fn::GetAtt': ['ImportStartLambda', 'Arn'] },
                    Events: ['s3:ObjectCreated:*'],
                    Filter: {
                        Key: {
                            FilterRules: [{
                                Name: 'prefix',
                                Value: 'data',
                            }],
                        },
                    },
                }, {
                    LambdaFunctionArn: { 'Fn::GetAtt': ['ImportStepLambda', 'Arn'] },
                    Events: ['s3:ObjectCreated:*'],
                    Filter: {
                        Key: {
                            FilterRules: [{
                                Name: 'prefix',
                                Value: 'status',
                            }],
                        },
                    },
                }],
            },
        },
    },
    ImportStartPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: { 'Fn::GetAtt': ['ImportStartLambda', 'Arn'] },
            Action: 'lambda:InvokeFunction',
            Principal: 's3.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' },
            SourceArn: { 'Fn::Sub': 'arn:aws:s3:::${ImportBucket}' },
        },
    },
    ImportStepPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: { 'Fn::GetAtt': ['ImportStepLambda', 'Arn'] },
            Action: 'lambda:InvokeFunction',
            Principal: 's3.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' },
            SourceArn: { 'Fn::Sub': 'arn:aws:s3:::${ImportBucket}' },
        },
    },

};
