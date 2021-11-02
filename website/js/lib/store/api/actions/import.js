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
    listExamples(context){
        return context.dispatch('_request',{
            url:context.rootState.info._links.examples.href,
            method:'get'
        })
        .then(x=>{  
            return Promise.all(x.examples.map(async example=>{
                if(_.get(example,"description.href")){
                    example.text=await context.dispatch('_request',{
                        url:example.description.href,
                        method:'get'
                    })
                }
                return example
            }))
        })
    },
    async getExampleDescription(context,example){
        if(_.get(example,"description.href")){
            return await context.dispatch('_request',{
                url:example.description.href,
                method:'get'
            })
        }
    },
    startImport(context,opts){
        aws.config.credentials=context.rootState.user.credentials
        var s3=new aws.S3({region:context.rootState.info.region})
        return context.dispatch('_request',{
            url:context.rootState.info._links.jobs.href,
            method:'get'
        })
        .tap(response=>s3.putObject({
            Bucket:response._links.imports.bucket,
            Key:response._links.imports.uploadPrefix+opts.name,
            Body:opts.qa.map(JSON.stringify).join('\n')
        }).promise())
    },
    waitForImport(context,opts){
        return new Promise(function(res,rej){
            next(10) 
            
            function next(count){
                context.dispatch('_request',{
                    url:context.rootState.info._links.jobs.href,
                    method:'get'
                })
                .then(response=>context.dispatch('_request',{
                    url:response._links.imports.href,
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
    listImports(context,opts){
        return context.dispatch('_request',{
            url:context.rootState.info._links.jobs.href,
            method:'get'
        })
        .then(response=>context.dispatch('_request',{
            url:response._links.imports.href,
            method:'get'
        }))
    },
    getImport(context,opts){
        return context.dispatch('_request',{
            url:opts.href,
            method:'get'
        })
    },
    deleteImport(context,opts){
        return context.dispatch('_request',{
            url:opts.href,
            method:'delete'
        })
    },
    getTerminologies(context, opts) {
        return context.dispatch("_request", {
          url: context.rootState.info._links.translate.href + "/list",
          method: "post",
        });
      },
    startImportTranslate(context,opts){
        return context.dispatch('_request',{
            url:context.rootState.info._links.translate.href + "/import",
            method:'post',
            body: 
            {"name":opts.name,
             "description":opts.description,
             "file": opts.file
            }
        })
    },
}






