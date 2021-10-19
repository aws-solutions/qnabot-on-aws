// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var config=require('../../config')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.profile
var Promise=require('bluebird')
var merge=require('webpack-merge').smart
var path=require('path')
var webpack=require('webpack')
var _=require('lodash')

module.exports = Promise.join(
    require('./base.config'),
    process.env.NODE_ENV==='dev' ? require('./dev.config') : {},
    process.env.NODE_ENV==='prod' ? require('./prod.config') : {}
).then(merge)
