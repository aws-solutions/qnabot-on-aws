#! /usr/bin/env node
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
const sass = require('sass');

const client = sass.compileString(
    fs.readFileSync(`${__dirname}/client.scss`, 'utf8'),
    { style: 'compressed' },
).css;

const designer = sass.compileString(
    fs.readFileSync(`${__dirname}/designer.scss`, 'utf8'),
    { style: 'compressed' },
).css;

module.exports = {
    client,
    designer,
};
