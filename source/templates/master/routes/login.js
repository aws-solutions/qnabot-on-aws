/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const resource = require('./util/resource');
const redirect = require('./util/redirect');

module.exports = {
    Login: resource('pages'),
    DesignerLoginResource: resource('designer', { Ref: 'Login' }),
    ClientLoginResource: resource('client', { Ref: 'Login' }),
    DesignerLoginResourceGet: redirect(
        { 'Fn::GetAtt': ['DesignerLogin', 'loginUrl'] },
        { Ref: 'DesignerLoginResource' },
    ),
    ClientLoginResourceGet: redirect(
        { 'Fn::GetAtt': ['ClientLogin', 'loginUrl'] },
        { Ref: 'ClientLoginResource' },
    ),
};
