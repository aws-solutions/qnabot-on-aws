/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const lib = './lib/middleware';
const router = new (require('./lib/router'))();
const fs = require('fs');

const middleware = fs.readdirSync(`${__dirname}/${lib}`)
    .filter((name) => name.match(/\d*_.*\.js/))  // NOSONAR - javascript:S5852 - input is user controlled and we have a limit on the number of characters
    .sort()
    .forEach((name) => {
        router.add(require(`${lib}/${name}`));
    });

exports.handler = async (event, context) => {
    return await router.start(event);
};

// Increment the return value to force a new version on update and adjust alias to the use the new version
exports.version = async function () {
    return 'V2';
};
