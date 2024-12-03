/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
module.exports = {
    getGenesysCallFlow(context, opts) {
        return context.dispatch('_request', {
            url: context.rootState.info._links.genesys.href,
            method: 'get',
        });
    },
};
