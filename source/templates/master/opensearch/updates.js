/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const util = require('../../util');

module.exports = {
    OpenSearchLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Condition: 'FGACEnabled',
        Properties: {
            LogGroupName: { 'Fn::Sub': '/aws/opensearch/${AWS::StackName}-${ESVar.ESDomain}' },
            RetentionInDays: {
                'Fn::If': [
                    'LogRetentionPeriodIsNotZero',
                    { Ref: 'LogRetentionPeriod' },
                    { Ref: 'AWS::NoValue' }
                ]
            },
        },
        Metadata: {
            cfn_nag: {
                rules_to_suppress: [
                    {
                        id: 'W86',
                        reason: 'LogGroup is encrypted by default.',
                    }
                ],
            },
            guard: util.cfnGuard('CLOUDWATCH_LOG_GROUP_ENCRYPTED', 'CW_LOGGROUP_RETENTION_PERIOD_CHECK'),
        },
    },
    OpenSearchLogGroupResourcePolicy: {
        Type: 'AWS::Logs::ResourcePolicy',
        Condition: 'FGACEnabled',
        DependsOn: ['OpenSearchLogGroup'],
        Properties: {
            PolicyName: { 'Fn::Sub': '${AWS::StackName}-AWSQnaBotOpenSearchLogResourcePolicy' },
            PolicyDocument: JSON.stringify(util.openSearchLogResourcePolicy())
        }
    },
    OpenSearchCognitoAccessUpdates: {
        DependsOn: [
            'OpensearchDomain',
            'Index',
            'FeedbackIndex',
            'MetricsIndex',
            'ESCognitoRole',
            'OpenSearchLogGroupResourcePolicy'
        ],
        Type: 'Custom::OpenSearchUpdates',
        Condition: 'FGACEnabled',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            DomainName: { 'Fn::GetAtt': ['ESVar', 'ESDomain'] },
            AccessPolicies: util.openSearchAccessPolicy(),
            LogPublishingOptions: {
                SEARCH_SLOW_LOGS: {
                    CloudWatchLogsLogGroupArn: { 'Fn::GetAtt': ['OpenSearchLogGroup', 'Arn'] },
                    Enabled: true
                },
                INDEX_SLOW_LOGS: {
                    CloudWatchLogsLogGroupArn: { 'Fn::GetAtt': ['OpenSearchLogGroup', 'Arn'] },
                    Enabled: true
                },
                AUDIT_LOGS: {
                    CloudWatchLogsLogGroupArn: { 'Fn::GetAtt': ['OpenSearchLogGroup', 'Arn'] },
                    Enabled: true
                },
                ES_APPLICATION_LOGS: {
                    CloudWatchLogsLogGroupArn: { 'Fn::GetAtt': ['OpenSearchLogGroup', 'Arn'] },
                    Enabled: true
                }
            },
            AdvancedSecurityOptions: util.advancedSecurityOptions(),
        }
    }
};
