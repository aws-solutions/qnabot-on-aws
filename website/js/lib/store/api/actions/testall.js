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

module.exports={
    startTestAll:async function(context,opts){
        var info=await context.dispatch('_request',{
            url:context.rootState.info._links.jobs.href,
            method:'get'
        })
        var result=await context.dispatch('_request',{
            url:`${info._links.testall.href}/${opts.name}`,
            method:'put',
            body:opts.filter ? {filter:`${opts.filter}.*`} : {}
        })
    },
    downloadTestAll:async function(context,opts){
        aws.config.credentials=context.rootState.user.credentials
        var s3=new aws.S3({region:context.rootState.info.region})
        var result=await s3.getObject({
            Bucket:opts.bucket,
            Key:opts.key
        }).promise()
        return(result.Body.toString());
    },
    waitForTestAll(context,opts){
        return new Promise(function(res,rej){
            next(10) 
            
            function next(count){
                context.dispatch('_request',{
                    url:context.rootState.info._links.jobs.href,
                    method:'get'
                })
                .then(response=>context.dispatch('_request',{
                    url:response._links.testall.href,
                    method:'get'
                }))
                .then(result=>{
                    var job=result.jobs.find(x=>x.id===opts.id)
                    if(job){
                        res(job)
                    }else{
                        count>0 ? setTimeout(()=>next(--count),200) : rej("timeout")
                    }
                })
            }
        })
    },
    listTestAll(context,opts){
        return context.dispatch('_request',{
            url:context.rootState.info._links.jobs.href,
            method:'get'
        })
        .then(response=>context.dispatch('_request',{
            url:response._links.testall.href,
            method:'get'
        }))
    },
    getTestAll(context,opts){
        return context.dispatch('_request',{
            url:opts.href,
            method:'get'
        })
    },
    deleteTestAll(context,opts){
        return context.dispatch('_request',{
            url:opts.href,
            method:'delete'
        })
    },
}






