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
module.exports={
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
        if(credentials.needsRefresh()){
            var ready=credentials.refreshPromise()
                .then(function(){
                    console.log("credentials refreshed")
                })
        }else{
            var ready=Promise.resolve(credentials)
        }
        return ready.then(function(creds){
            var signed=sign(request,creds)        
            delete request.headers["Host"]
            delete request.headers["Content-Length"]        

            return Promise.resolve(axios(signed))
        })
        .catch(x=>x.response.status===403,function(){
            console.log("UnAuth Error") 
            var login=_.get(context,"rootState.info._links.DesignerLogin.href")
            console.log(login)
            if(login){
                var result=window.confirm("You need to be logged in to use this page. click ok to be redirected to the login page") 
                if(result) window.window.location.href=login
            }
            return Promise.reject()
        })
        .get('data')
        .tap(()=>context.commit('loading',false))
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
    bulk(context,body){
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href,
            method:'put',
            body:body.qna,
            reason:"Failed to Bulk upload"
        })
    },
    list(context,opts){
        return context.dispatch('_request',{
            url:context.rootState.info._links.questions.href+'?'+query({
                from:opts.page || 0,
                filter:opts.filter ? opts.filter+".*" : "",
                perpage:opts.perpage || 10
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
            body:[payload],
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






