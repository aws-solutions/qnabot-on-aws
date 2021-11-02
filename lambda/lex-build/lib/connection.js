// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const Promise=require('bluebird')
const AWS = require('./aws.js');
const myCredentials = new AWS.EnvironmentCredentials('AWS');
const _=require('lodash')

module.exports=_.memoize(function(address){
    return require('elasticsearch').Client({
        requestTimeout:10*1000,
        pingTimeout:10*1000,
        hosts:process.env.ADDRESS,
        connectionClass: require('http-aws-es'),
        defer: function () {
            return Promise.defer();
        },
        amazonES: {
            region: process.env.AWS_REGION,
            credentials: myCredentials
        }
    })
})
