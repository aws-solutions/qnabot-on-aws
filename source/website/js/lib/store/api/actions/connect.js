/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
module.exports = {
    getContactFlow(context, opts) {
        return context.dispatch('_request', {
            url: context.rootState.info._links.connect.href,
            method: 'get',
        });
    },
};
