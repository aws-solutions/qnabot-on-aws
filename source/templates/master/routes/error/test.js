/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

process.argv.push('--debug');
const { run } = require('../util/temp-test');
const { input } = require('../util/temp-test');

module.exports = {
    error: {
        get: (test) => run(
            `${__dirname}/` + 'error',
            input({
                errorMessage: JSON.stringify(
                    { status: 404, message: 'aaa' },
                ),
            }),
            test,
        ),
    },
};
