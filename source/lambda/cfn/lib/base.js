/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = class CognitoUser {
    Create(params, reply) {
        reply(null, 'user', null);
    }

    Update(ID, params, oldparams, reply) {
        reply(null, ID, null);
    }

    Delete(ID, params, reply) {
        reply(null, ID, null);
    }
};
