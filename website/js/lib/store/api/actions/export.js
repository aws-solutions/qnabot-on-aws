/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
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
    startExport:async function(context,opts){
        var info=await context.dispatch('_request',{
            url:context.rootState.info._links.jobs.href,
            method:'get'
        })
        var result=await context.dispatch('_request',{
            url:`${info._links.exports.href}/${opts.name}`,
            method:'put',
            body:opts.filter ? {filter:`${opts.filter}.*`} : {}
        })
    },
    downloadExport:async function(context,opts){
        aws.config.credentials=context.rootState.user.credentials
        var s3=new aws.S3({region:context.rootState.info.region})
        var result=await s3.getObject({
            Bucket:opts.bucket,
            Key:opts.key
        }).promise()

        var qa=result.Body.toString()
        return `{"qna":[${qa.replace(/\n/g,',\n')}]}`
    },
    waitForExport(context,opts){
        return new Promise(function(res,rej){
            next(10) 
            
            function next(count){
                context.dispatch('_request',{
                    url:context.rootState.info._links.jobs.href,
                    method:'get'
                })
                .then(response=>context.dispatch('_request',{
                    url:response._links.exports.href,
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
    listExports(context,opts){
        return context.dispatch('_request',{
            url:context.rootState.info._links.jobs.href,
            method:'get'
        })
        .then(response=>context.dispatch('_request',{
            url:response._links.exports.href,
            method:'get'
        }))
    },
    getExport(context,opts){
        return context.dispatch('_request',{
            url:opts.href,
            method:'get'
        })
    },
    deleteExport(context,opts){
        return context.dispatch('_request',{
            url:opts.href,
            method:'delete'
        })
    },
}






