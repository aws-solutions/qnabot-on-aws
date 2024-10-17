/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

process.argv.push('--debug');
const { run } = require('../util/temp-test');

module.exports = {
    info: (test) => run(`${__dirname}/` + 'info', {}, test),
};
