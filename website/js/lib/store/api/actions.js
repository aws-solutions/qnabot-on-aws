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
var reason=function(r){
    return (err)=>{ 
        console.log(err)
        Promise.reject(r)
    }
}
var aws=require('aws-sdk')

var failed=false
module.exports={
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
                    if(result.jobs.map(x=>x.id).includes(opts.id)){
                        res()
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
    _request(context,opts){
        var url=Url.parse(opts.url)
        var request={
            host:url.hostname,
            method:opts.method.toUpperCase(),
            url:url.href,
            path:url.path,
            headers:opts.headers || {}
        }
        if(opts.body){
            request.body=JSON.stringify(opts.body),
            request.data=opts.body,
            request.headers['content-type']='application/json'
        }
        context.commit('loading',true)

        var credentials=context.rootState.user.credentials
        
        return Promise.try(function(){
            if(credentials.needsRefresh()){
                return credentials.refreshPromise()
            }
        })
        .then(function(){
            var signed=sign(request,credentials)        
            delete request.headers["Host"]
            delete request.headers["Content-Length"]        

            return Promise.resolve(axios(signed))
        })
        .get('data')
        .tap(()=>context.commit('loading',false))
        .tapCatch(x=>x.response.status===403,function(){
            console.log("UnAuth Error") 
            context.commit('loading',false)
            var login=_.get(context,"rootState.info._links.DesignerLogin.href")
            console.log(login)
            if(login && !failed){
                failed=true
                var result=window.confirm("You need to be logged in to use this page. click ok to be redirected to the login page") 
                if(result) window.window.location.href=login
            }
        })
        .tapCatch(error=>error.response && error.response.status!==403,error=>{
            var message={
                response:_.get(error,"response.data"),
                status:_.get(error,"response.status")
            }
            window.alert("Request Failed:"+JSON.stringify(message,null,2))
            return Promise.reject(message)
        })
    },
    botinfo(context){
        return context.dispatch('_request',{
            url:context.rootState.info._links.bot.href,
            method:'get',
            reason:"Failed to get BotInfo"
        })
    },
    utterances(context){
        return context.dispatch('_request',{
            url:context.rootState.bot._links.utterances.href,
            method:'get',
            reason:"Failed to get BotInfo"
        })
    },
    alexa(context){
        return context.dispatch('_request',{
            url:context.rootState.bot._links.alexa.href,
            method:'get',
            reason:"Failed to get Alexa info"
        })
    },
    schema(context,body){
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href,
            method:'options',
            reason:"Failed to get qa options"
        })
    },
    list(context,opts){
        var perpage=opts.perpage || 10
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href+'?'+query({
                from:(opts.page || 0)*perpage,
                filter:opts.filter ? opts.filter+".*" : "",
                order:opts.order,
                perpage
            }),
            method:'get',
            reason:"Failed to get page:"+opts.page
        })
    },
    check(context,qid){
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href+'/'+qid,
            method:'head',
            reason:qid+' does not exists'
        })
        .then(()=>true)
        .catch(()=>false)
    },
    add(context,payload){
        return context.dispatch('update',payload)
    },
    update(context,payload){
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href+'/'+payload.qid,
            method:'put',
            body:payload,
            reason:'failed to update'
        })
    },
    remove(context,qid){
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href+'/'+qid,
            method:'delete',
            reason:'failed to delete'
        })
    },
    removeBulk(context,list){
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href,
            method:'delete',
            reason:'failed to delete',
            body:{list:list}
        })
    },
    removeQuery(context,query){
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href,
            method:'delete',
            reason:'failed to delete',
            body:{query:query}
        })
    },
    build(context){
        return context.dispatch('_request',{
            url:context.rootState.info._links.bot.href,
            method:'post',
            body:{},
            reason:'failed to build'
        })
    },
    status(context){
        return context.dispatch('_request',{
            url:context.rootState.info._links.bot.href,
            method:'get',
            reason:'failed to get status'
        })
    },
    search(context,opts){
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href+'?'+query({
                query:opts.query,
                topic:opts.topic || "",
                from:opts.from || 0
            }),
            method:'get',
            reason:'failed to get search'
        })
    }
}






