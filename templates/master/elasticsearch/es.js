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

const util = require('../../util');

const properties = {
    CognitoOptions: {
        Enabled: true,
        IdentityPoolId: { Ref: 'KibanaIdPool' },
        RoleArn: { 'Fn::GetAtt': ['ESCognitoRole', 'Arn'] },
        UserPoolId: { Ref: 'UserPool' },
    },
    ClusterConfig: {
        DedicatedMasterEnabled: false,
        InstanceCount: { Ref: 'ElasticSearchNodeCount' },
        InstanceType: { 'Fn::If': ['Encrypted', 'm6g.large.search', 't3.small.search'] },
        ZoneAwarenessEnabled: { 'Fn::If': ['SingleNode', false, true] },
    },
    EBSOptions: {
        EBSEnabled: true,
        VolumeSize: { Ref: 'ElasticSearchEBSVolumeSize' },
        VolumeType: 'gp2',
    },
    EngineVersion: 'OpenSearch_1.3',
    SnapshotOptions: {
        AutomatedSnapshotStartHour: '0',
    },
    AdvancedOptions: {
        'rest.action.multi.allow_explicit_index': 'true',
    },
    EncryptionAtRestOptions: {
        Enabled: { 'Fn::If': ['Encrypted', true, false] },
    },
    NodeToNodeEncryptionOptions: {
        Enabled: { 'Fn::If': ['Encrypted', true, false] },
    },
    DomainEndpointOptions: {
        EnforceHTTPS: { 'Fn::If': ['Encrypted', true, false] },
    },
    VPCOptions: {
        'Fn::If': ['VPCEnabled', {
            SubnetIds: { Ref: 'VPCSubnetIdList' },
            SecurityGroupIds: { Ref: 'VPCSecurityGroupIdList' },
        }, { Ref: 'AWS::NoValue' }],
    },
};

module.exports = {
    OpensearchDomain: {
        Type: 'AWS::OpenSearchService::Domain',
        DependsOn: ['PreUpgradeExport'],
        Condition: 'CreateDomain',
        Properties: properties,
    },
    ESCognitoRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'es.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            },
            Path: '/',
            Policies: [
                util.esCognitoAccess(),
            ],
        },
        Metadata: util.cfnNag(['W11', 'W12', 'F38']),
    },
};
