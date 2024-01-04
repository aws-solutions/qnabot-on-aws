/*********************************************************************************************************************
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
 *********************************************************************************************************************/
const lib = './lib/middleware';
const router = new (require('./lib/router'))();
const fs = require('fs');
const esWarmer = new (require('./lib/warmer'))();

const middleware = fs.readdirSync(`${__dirname}/${lib}`)
    .filter((name) => name.match(/\d*_.*\.js/))  // NOSONAR - javascript:S5852 - input is user controlled and we have a limit on the number of characters
    .sort()
    .forEach((name) => {
        router.add(require(`${lib}/${name}`));
    });

exports.handler = function (event, context, callback) {
    router.start(event, callback);
};

exports.warmer = async function (event, context, callback) {
    await esWarmer.perform(event, context, callback);
    return 'complete';
};

// Increment the return value to force a new version on update and adjust alias to the use the new version
exports.version = async function () {
    return 'V2';
};
