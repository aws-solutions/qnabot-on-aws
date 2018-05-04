/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')
var validator = new (require('jsonschema').Validator)();
var axios=require('axios')
var util=require('./util')
var api=util.api

module.exports={
    build(context){
        context.rootState.bot.status="Submitting"
        return api(context,'botinfo')
        .then(function(result){
            if(result.status==='READY'){
                return api(context,'build')
            }else if(result.status==='BUILDING'){
                return 
            }else {
                return Promise.reject("cannot build, bot in state "+result.status)
            }
        })
        .delay(200)
        .then(function(result){
            return new Promise(function(res,rej){
                var next=function(count){
                    api(context,'botinfo')
                    .then(function(info){
                        if(info.build.token===result.token){
                            context.rootState.bot.status=info.build.status
                            context.rootState.bot.message=info.build.message
                            if(info.build.status==="READY"){
                                res()
                            }else if(info.build.status==="Failed"){
                                rej("build failed:"+info.build.message)
                            }else{
                                count>0 ? setTimeout(()=>next(--count),1000) 
                                    : rej(" build timed out")
                            }
                        }else{
                            context.rootState.bot.status="Waiting"
                            count>0 ? setTimeout(()=>next(--count),1000) 
                                : rej(" build timed out")
                        }
                    })
                    .catch(rej)
                }
                next(60*5)
            })
        })
        .tapCatch(util.handle.bind(context)('Failed to Build'))
    },
    update(context,qa){
        return api(context,'update',clean(_.omit(qa,['select','_score'])))
    },
    add(context,qa){
        return api(context,'update',clean(qa))
        .tap(()=>context.commit('page/incrementTotal',null,{root:true}))
    }
}
function clean(obj){
    if(typeof obj==="object"){
        for (var key in obj){
            obj[key]=clean(obj[key])
        }
        return obj
    }else if(Array.isArray(obj)){
        for( var i=0; i<obj.length; i++){
            obj[i]=clean(obj[i])
        }
    }else if(obj.trim){
        return obj.trim()
    }else{
        return obj
    }
}
