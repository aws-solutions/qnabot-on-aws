// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var lambda=require('./setup.js')
var outputs=require('../../../bin/exports')
var Promise=require('bluebird')
var run=function(params,test){
    return lambda(params)
        .tap(msg=>console.log(JSON.stringify(msg)))
        .tap(test.ok)
        .error(test.ifError)
        .catch(test.ifError)
        .finally(test.done)
}

module.exports={
    build:async function(test){
        var master=await outputs('dev/master',{wait:true})
        var lambda=await outputs('dev/lambda',{wait:true})

        process.env.POLL_LAMBDA=lambda.lambda
        process.env.BOTNAME=master.BotName
        process.env.SLOTTYPE=master.SlotType
        process.env.INTENT=master.Intent
        process.env.ADDRESS=master.ElasticsearchEndpoint
        process.env.INDEX=master.ElasticsearchIndex
        process.env.TYPE=master.ElasticsearchType
       
        var params={}
        run(params,test)
    }
}


