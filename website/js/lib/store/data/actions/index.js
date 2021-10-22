// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Promise=require('bluebird')
var validator = new (require('jsonschema').Validator)();
var axios=require('axios')
var util=require('./util')


module.exports=Object.assign(
    require('./get'),
    require('./delete'),
    require('./up-download'),
    require('./add')
)

