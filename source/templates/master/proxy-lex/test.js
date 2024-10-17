/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

process.env.AWS_PROFILE = require('../../../config.json').profile;
process.env.AWS_DEFAULT_REGION = require('../../../config.json').region;
process.env.AWS_REGION = require('../../../config.json').region;

const { handler } = require('./handler');

module.exports = {
    get(test) {
        handler({
            fnc: 'getBots',
            params: { maxResults: 2 },
        }, {}, (err, result) => {
            console.log('error', err);
            console.log('result:', JSON.stringify(result, null, 2));
            test.ifError(err);
            test.ok(result);
            test.done();
        });
    },
};
