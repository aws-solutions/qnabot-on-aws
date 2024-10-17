/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const validator = new (require('jsonschema').Validator)();
const axios = require('axios');
const util = require('./util');

module.exports = Object.assign(
    require('./get'),
    require('./delete'),
    require('./up-download'),
    require('./add'),
);
