#! /usr/bin/env node
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
