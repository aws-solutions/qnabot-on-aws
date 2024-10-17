/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const load = require('./load');

module.exports = async function (config) {
    try {
        const body = {
            endpoint: process.env.ES_ENDPOINT,
            method: 'POST',
            path: '_search/scroll',
            body: {
                scroll: '1m',
                scroll_id: config.scroll_id,
            },
        };
        return await load(config, body);
    } catch (error) {
        console.error('An error occurred in step task: ', error);
        throw error;
    }
};
