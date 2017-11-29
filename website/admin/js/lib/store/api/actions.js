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
        var url=Url.parse(context.rootState.info.apiUrl+opts.url)
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
        .get('data')
        .tap(()=>context.commit('loading',false))
        .catch(reason(opts.reason || "Request Failed")) 
    },
    botinfo(context){
        return context.dispatch('_request',{
            url:'/bot',
            method:'get',
            reason:"Failed to get BotInfo"
        })
    },
    bulk(context,body){
        return context.dispatch('_request',{
            url:'/',
            method:'put',
            body:body.qna,
            reason:"Failed to Bulk upload"
        })
    },
    list(context,opts){
        return context.dispatch('_request',{
            url:'/?'+query({
                page:opts.page || 0,
                filter:opts.filter || "",
                perpage:opts.perpage || 10
            }),
            method:'get',
            reason:"Failed to get page:"+opts.page
        })
    },
    check(context,qid){
        return context.dispatch('_request',{
            url:'/questions/'+qid,
            method:'head',
            reason:qid+' does not exists'
        })
        .then(()=>false)
        .catch(()=>true)
    },
    add(context,payload){
        return context.dispatch('update',payload)
    },
    update(context,payload){
        payload.card.imageUrl=payload.card.imageUrl.trim() 
        return context.dispatch('_request',{
            url:'/questions/'+payload.qid,
            method:'put',
            body:[payload],
            reason:'failed to update'
        })
    },
    remove(context,qid){
        return context.dispatch('_request',{
            url:'/questions/'+qid,
            method:'delete',
            reason:'failed to delete'
        })
    },
    build(context){
        return context.dispatch('_request',{
            url:'/bot',
            method:'post',
            body:{},
            reason:'failed to build'
        })
    },
    status(context){
        return context.dispatch('_request',{
            url:'/bot/status',
            method:'get',
            reason:'failed to get status'
        })
    },
    search(context,opts){
        return context.dispatch('_request',{
            url:'/questions?'+query({
                query:opts.query,
                topic:opts.topic || "",
                from:opts.from || 0
            }),
            method:'get',
            reason:'failed to get search'
        })
    }
}






