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
var aws=require('aws-sdk');

function getParameters(ssm, params) {
    return new Promise(function(resolve, reject) {
        ssm.getParameters(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                reject('Error back from request: ' + err);
            } else {
                const custom_settings = JSON.parse(data.Parameters[0].Value);
                const default_settings = JSON.parse(data.Parameters[1].Value);
                const cloned_default = _.clone(default_settings);
                const merged_settings = _.merge(cloned_default, custom_settings);
                const settings = [default_settings, custom_settings, merged_settings]
                resolve(settings);
            }
        })
    })
}

async function listSettings(context) {
    aws.config.credentials=context.rootState.user.credentials
    const customParams = context.rootState.info.CustomQnABotSettings;
    const defaultParams = context.rootState.info.DefaultQnABotSettings;
    const ssm = new aws.SSM({region:context.rootState.info.region})
    const query = {
        Names: [customParams, defaultParams],
        WithDecryption:true,
    }
    var response = await getParameters(ssm, query);
    return response;
}

var failed=false;
module.exports={
    startExport:async function(context,opts){
        var info=await context.dispatch('_request',{
            url:context.rootState.info._links.jobs.href,
            method:'get'
        })
        const settings = await listSettings(context);
        const merged = settings[2];
        let headers = undefined;
        if (merged.S3_PUT_REQUEST_ENCRYPTION && merged.S3_PUT_REQUEST_ENCRYPTION.length>0) {
            headers = {'x-amz-server-side-encryption': merged.S3_PUT_REQUEST_ENCRYPTION};
            console.log(`headers: ${headers}`);
        }
        var result=await context.dispatch('_request',{
            url:`${info._links.exports.href}/${opts.name}`,
            method:'put',
            headers: headers ? headers : undefined,
            body:opts.filter ? {filter:`${opts.filter}.*`, prefix:''} : {prefix:''}
        })
    },
    startKendraSyncExport:async function(context,opts){
        console.log("Entering startKendraSyncExport function");
        var info=await context.dispatch('_request',{
            url:context.rootState.info._links.jobs.href,
            method:'get'
        })

        var result=await context.dispatch('_request',{
            url:`${info._links.exports.href}/${opts.name}`,
            method:'put',
            body:opts.filter ? {filter:`${opts.filter}.*`, prefix:'kendra-'} : {prefix:'kendra-'}
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
    getExportByJobId(context,id){
        return context.dispatch('_request',{
            url:context.rootState.info._links.jobs.href + '/exports/' + id,
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






