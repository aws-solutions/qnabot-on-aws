/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const mock = require('../util/mock');

module.exports = {
    rootGet: mock({
        auth: 'NONE',
        method: 'GET',
        subTemplate: 'root/info',
        resource: { 'Fn::GetAtt': ['API', 'RootResourceId'] },
    }),
};
