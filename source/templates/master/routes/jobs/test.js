/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */


process.argv.push('--debug');
const { run } = require('../util/temp-test');
const { input } = require('../util/temp-test');

module.exports = {
    info: (test) => run(`${__dirname}/` + 'info', {}, test),
    start: (test) => run(`${__dirname}/` + 'export-start', {}, test),
    listExports: (test) => run(`${__dirname}/` + 'list-export', {
        perpage: 100,
        token: '',
    }, test),
    list: (test) => run(`${__dirname}/` + 'list', input({
        perpage: 100,
        token: '',
    }), test),
};
