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

    const { IAMClient, GetPolicyCommand, CreatePolicyCommand, GetRoleCommand, CreateRoleCommand, AttachRolePolicyCommand } = require('@aws-sdk/client-iam');
    const { KendraClient, CreateIndexCommand } = require('@aws-sdk/client-kendra');
    const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
    const region = process.env.AWS_REGION;
    const sts = new STSClient({ region });

    const getCallerIdentityCmd = new GetCallerIdentityCommand({});
    const account = (await sts.send(getCallerIdentityCmd)).Account;
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

    const iam = new IAMClient({ region });
    let doesPolicyExist = false;
    try {
        const policyCmd = new GetPolicyCommand(getPolicyParams);
        policy = await iam.send(policyCmd);
        doesPolicyExist = true;
    } catch {}

    if (!doesPolicyExist) {
        const params = {
            PolicyDocument: JSON.stringify(policy),
            PolicyName: `AmazonKendra-${region}-QnABot`,
            Description: 'Policy for Kendra - Created by QnABot'
        };
        const createPolicyCmd = new CreatePolicyCommand(params);
        await iam.send(createPolicyCmd);
    }

    let doesRoleExist = false;

    try {
        const getRoleCmd = new GetRoleCommand({ RoleName: `AmazonKendra-${region}-QnaBot` });
        await iam.send(getRoleCmd);
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
        const createRoleCmd = new CreateRoleCommand(params);
        await iam.send(createRoleCmd);
    }

    const params = {
        PolicyArn: `arn:aws:iam::${account}:policy/AmazonKendra-${region}-QnABot`,
        RoleName: `AmazonKendra-${region}-QnaBot`
    };
    const attachRoleCmd = new AttachRolePolicyCommand(params)
    await iam.send(attachRoleCmd);

    const kendra = new KendraClient({ region });

    const indexResult = await kendra.listIndices();
    const indexCount = indexResult.IndexConfigurationSummaryItems.length;
    let createdIndex = null;
    if (indexCount == 0) {
        const kendraCreateIndexParams = {
            Name: 'QnABot' /* required */,
            RoleArn: `arn:aws:iam::${account}:role/AmazonKendra-${region}-QnaBot` /* required */,
            Description: 'Created by QnABot',
            Edition: 'ENTERPRISE_EDITION'
        };
        const createIndexCmd = new CreateIndexCommand(kendraCreateIndexParams)
        createdIndex = await kendra.send(createIndexCmd).Id;
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
