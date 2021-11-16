// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const Promise=require('bluebird')
const _=require('lodash')
const run=require('./run.js')

exports.bot=function(name,version){
    return Promise.all(run('getBotVersions',{name}).get('bots')
    .map(x=>x.version)
    .filter(x=>!_.includes(["$LATEST",version],x))
    .map(x=>run('deleteBotVersion',{name,version:x})))
}
exports.intent=function(name,version){
    return Promise.all(run('getIntentVersions',{name,}).get('intents')
    .map(x=>x.version)
    .filter(x=>!_.includes(["$LATEST",version],x))
    .map(x=>run('deleteIntentVersion',{name,version:x})))
}
exports.slot=function(name,version){
    return Promise.all(run('getSlotTypeVersions',{name}).get('slotTypes')
    .map(x=>x.version)
    .filter(x=>!_.includes(["$LATEST",version],x))
    .map(x=>run('deleteSlotTypeVersion',{name,version:x})))
}

