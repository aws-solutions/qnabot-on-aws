/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = function (path, parent = { 'Fn::GetAtt': ['API', 'RootResourceId'] }) {
    return {
        Type: 'AWS::ApiGateway::Resource',
        Properties: {
            ParentId: parent,
            PathPart: path,
            RestApiId: { Ref: 'API' },
        },
    };
};
