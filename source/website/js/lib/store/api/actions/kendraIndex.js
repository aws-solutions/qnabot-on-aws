/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    // point to new Kendra Lambda instead of the old one
    startKendraV2Indexing(context, opts) {
        return context.dispatch('_request', {
            url: context.rootState.info._links.crawlerV2.href,
            method: 'post',
        });
    },
    getKendraIndexingStatus(context, opts) {
        return context.dispatch('_request', {
            url: context.rootState.info._links.crawlerV2.href,
            method: 'get',
        });
    },
};
