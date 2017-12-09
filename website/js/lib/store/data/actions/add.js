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
        return api(context,'build')
        .delay(10*1000)
        .then(function(){
            return new Promise(function(res,rej){
                var next=function(count){
                    api(context,'status')
                    .tap(console.log)
                    .then(function(stat){
                        console.log("tries:"+count)
                        if(stat==="READY"){
                            res()
                        }else if(stat==="BUILDING"){
                            count>0 ? setTimeout(()=>next(--count),1000) : rej("TimeOut")
                        }else{
                            rej("Error:"+stat.error)
                        }
                    })
                }
                next(100)
            })
        })
        .tapCatch(util.handle.bind(context)('Failed to Build'))
    },
    update(context,qa){
        return api(context,'update',{
            qid:qa.qid,
            q:qa.q,
            a:qa.a,
            t:qa.t,
            r:qa.r
        })
    },
    add(context,qa){
        return api(context,'update',{
            qid:qa.qid,
            q:[].concat(qa.q),
            a:qa.a
        })
        .tap(()=>context.commit('page/incrementTotal',null,{root:true}))
    },
    changeId(context,{qa,New}){
        return api(context,'check',New)
        .tap(console.log)
        .then(val=>!val ? Promise.resolve() : Promise.reject('Id:'+New+' already exists'))
        .then(function(){
            var rm=qa.qid.text ? api(context,'remove',qa.qid.text) :Promise.resolve()
            qa.qid.text=New
            var add=api(context,'add',{
                qid:qa.qid.text,
                q:qa.questions.map(item=>item.text),
                a:qa.answer.text,
                card:JSON.parse(qa.card.text),
                t:qa.topic.text
            })
            return Promise.join(rm,add)
        })
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to change Id')
    }
}
