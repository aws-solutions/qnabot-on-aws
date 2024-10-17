/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('../../util');

module.exports = {
    UsersTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            BillingMode: 'PAY_PER_REQUEST',
            PointInTimeRecoverySpecification: {
                PointInTimeRecoveryEnabled: true,
            },
            AttributeDefinitions: [
                {
                    AttributeName: 'UserId',
                    AttributeType: 'S',
                },
            ],
            KeySchema: [
                {
                    AttributeName: 'UserId',
                    KeyType: 'HASH',
                },
            ],
        },
        Metadata: { cfn_nag: util.cfnNag(['W74']) },
    },
};
