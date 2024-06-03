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

