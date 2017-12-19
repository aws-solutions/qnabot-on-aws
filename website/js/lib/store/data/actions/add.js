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
        .delay(5*1000)
        .then(function(){
            return new Promise(function(res,rej){
                var next=function(count){
                    api(context,'botinfo').get('status')
                    .then(function(stat){
                        if(stat==="READY"){
                            res()
                        }else if(stat==="BUILDING"){
                            count>0 ? setTimeout(()=>next(--count),1000) : rej(" build timed out")
                        }else{
                            rej("build failed, bot in state "+stat.error)
                        }
                    })
                    .catch(rej)
                }
                next(100)
            })
        })
        .tapCatch(util.handle.bind(context)('Failed to Build'))
    },
    update(context,qa){
        return api(context,'update',_.omit(qa,['select','_score']))
    },
    add(context,qa){
        return api(context,'update',qa)
        .tap(()=>context.commit('page/incrementTotal',null,{root:true}))
    }
}
