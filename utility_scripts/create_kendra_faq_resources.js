#! /usr/bin/env node
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

(async () => {
    process.env.AWS_SDK_LOAD_CONFIG = true;

    const AWS = require('aws-sdk');
    const sts = new AWS.STS();
    const { region } = AWS.config;

    const account = (await sts.getCallerIdentity({}).promise()).Account;
    let policy = {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: 'Allow',
                Action: ['cloudwatch:PutMetricData'],
                Resource: '*',
                Condition: {
                    StringEquals: {
                        'cloudwatch:namespace': 'AWS/Kendra'
                    }
                }
            },
            {
                Effect: 'Allow',
                Action: ['logs:DescribeLogGroups'],
                Resource: '*'
            },
            {
                Effect: 'Allow',
                Action: ['logs:CreateLogGroup'],
                Resource: [`arn:aws:${region}:${account}:log-group:/aws/kendra/*`]
            },
            {
                Effect: 'Allow',
                Action: ['logs:DescribeLogStreams', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: [`arn:aws:logs:${region}:${account}:log-group:/aws/kendra/*:log-stream:*`]
            }
        ]
    };

    const getPolicyParams = {
        PolicyArn: `arn:aws:iam::${account}:policy/AmazonKendra-${region}-QnABot`
    };

    const iam = new AWS.IAM();
    let doesPolicyExist = false;
    try {
        policy = await iam.getPolicy(getPolicyParams).promise();
        doesPolicyExist = true;
    } catch {}

    if (!doesPolicyExist) {
        await iam
            .createPolicy({
                PolicyDocument: JSON.stringify(policy),
                PolicyName: `AmazonKendra-${region}-QnABot`,
                Description: 'Policy for Kendra - Created by QnABot'
            })
            .promise();
    }

    let doesRoleExist = false;

    try {
        await iam.getRole({ RoleName: `AmazonKendra-${region}-QnaBot` }).promise();
        doesRoleExist = true;
    } catch {}

    if (!doesRoleExist) {
        const policyDocument = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: {
                        Service: 'kendra.amazonaws.com'
                    },
                    Action: 'sts:AssumeRole'
                }
            ]
        };

        const params = {
            AssumeRolePolicyDocument: JSON.stringify(policyDocument),
            Path: '/',
            RoleName: `AmazonKendra-${region}-QnaBot`
        };
        await iam.createRole(params).promise();
    }

    const params = {
        PolicyArn: `arn:aws:iam::${account}:policy/AmazonKendra-${region}-QnABot`,
        RoleName: `AmazonKendra-${region}-QnaBot`
    };
    await iam.attachRolePolicy(params).promise();

    const kendra = new AWS.Kendra();

    const indexResult = await kendra.listIndices().promise();
    const indexCount = indexResult.IndexConfigurationSummaryItems.length;
    let createdIndex = null;
    if (indexCount == 0) {
        const kendraCreateIndexParams = {
            Name: 'QnABot' /* required */,
            RoleArn: `arn:aws:iam::${account}:role/AmazonKendra-${region}-QnaBot` /* required */,
            Description: 'Created by QnABot',
            Edition: 'ENTERPRISE_EDITION'
        };
        createdIndex = await kendra.createIndex(kendraCreateIndexParams).promise().Id;
    } else {
        console.log('WARNING:Existing Kendra indexes found.  Did not create a new index');
    }
    if (createdIndex) {
        console.log(`Add ${createdIndex} to the  KENDRA_FAQ_INDEX setting in the Content Designer`);
    } else {
        console.log('Add one of the following indexes to the  KENDRA_FAQ_INDEX setting in the Content Designer');
        for (index of indexResult.IndexConfigurationSummaryItems) {
            console.log(`${index.Id}    ${index.Status}`);
        }
    }
})();
