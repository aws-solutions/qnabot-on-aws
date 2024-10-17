/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const _ = require('lodash');

const ls = fs.readdirSync(__dirname);
module.exports = _.fromPairs(ls.filter((x) => x !== 'test.js' & x !== 'README.md')
    .map((x) => {
        console.log(`Loading:${x}`);
        return [x, require(`./${x}/test`)];
    }));
