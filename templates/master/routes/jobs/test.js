/** *******************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 ******************************************************************************************************************** */

const fs = require('fs');

process.argv.push('--debug');
const Velocity = require('velocity');
const { run } = require('../util/temp-test');
const { input } = require('../util/temp-test');
const env = require('../../../../bin/exports')();

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
