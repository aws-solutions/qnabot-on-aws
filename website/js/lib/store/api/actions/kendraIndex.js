// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var query=require('query-string').stringify
var _=require('lodash')
var Promise=require('bluebird')
var axios=require('axios')
var Url=require('url')
var sign=require('aws4').sign
var path=require('path')
var Mutex=require('async-mutex').Mutex
var aws=require('aws-sdk')
const mutex = new Mutex();

var reason=function(r){
    return (err)=>{ 
        console.log(err)
        Promise.reject(r)
    }
}
var aws=require('aws-sdk')
var failed=false
module.exports={

    startKendraIndexing(context,opts){
        return context.dispatch('_request',{
            url:context.rootState.info._links.crawler.href+`/start?message=start&topic=${context.rootState.info.KendraCrawlerSnsTopic}`,
            method:'post'
        })
    },
    getKendraIndexingStatus(context,opts){
        return context.dispatch('_request',{
            url:context.rootState.info._links.crawler.href+`/status`,
            method:'post'
        })
    },
}






