/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const config = require('../../config.json');
process.env.AWS_PROFILE = config.profile;
process.env.AWS_DEFAULT_REGION = config.region;
const { merge } = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const base = require('./base.config');
const dev = require('./dev.config');
const prod = require('./prod.config');

module.exports = process.env.NODE_ENV === 'dev' ? merge(base, dev) : merge(base, prod);

