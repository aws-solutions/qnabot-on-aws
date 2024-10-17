/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    dashboard: {
        Type: 'AWS::CloudWatch::Dashboard',
        Properties: {
            DashboardName: { 'Fn::Sub': '${AWS::Region}-${AWS::StackName}' },
            DashboardBody: { 'Fn::Sub': JSON.stringify(require('./body')) },
        },
    },
};
