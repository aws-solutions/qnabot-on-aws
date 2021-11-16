// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var lib='./lib/middleware'
var router=new (require('./lib/router'))()
var fs=require('fs')
const esWarmer=new (require('./lib/warmer'))();




var middleware=fs.readdirSync(`${__dirname}/${lib}`)
    .filter(name=>name.match(/\d*_.*\.js/))
    .sort()
    .forEach(name=>{
        router.add(require(`${lib}/${name}`))
    })

exports.handler=function(event,context,callback){
    router.start(event,callback)
}

exports.warmer=async function(event,context,callback) {
    await esWarmer.perform(event,context,callback);
    return "complete";
}



