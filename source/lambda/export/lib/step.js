/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const load = require('./load');

module.exports = function (config) {
    const body = {
        endpoint: process.env.ES_ENDPOINT,
        method: 'POST',
        path: '_search/scroll',
        body: {
            scroll: '1m',
            scroll_id: config.scroll_id,
        },
    };
    return load(config, body);
};
