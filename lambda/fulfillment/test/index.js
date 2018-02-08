/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var lambda=require('./setup.js')
var Promise=require('bluebird')
var _=require('lodash')

var Ajv=require('ajv')
var ajv=new Ajv()
var lexSchema=ajv.compile(require('./lex/schema'))
var alexaSchema=ajv.compile(require('./alexa/schema'))
process.env.EMPTYMESSAGE="empty"

var run=function(params,schema,test){
    return lambda(params)
        .tap(msg=>console.log(JSON.stringify(msg)))
        .tapCatch(msg=>console.log(JSON.stringify(msg)))
        .tap(test.ok)
        .tap(function(x){
            var v=schema(x)
            test.ok(v,JSON.stringify(schema.errors,null,2))
        })
        .catch(test.ifError)
        .finally(test.done)
}
var Router=new require('../lib/router')

module.exports={
    middleware:{
        parse:test=>{
            var event=require('./lex')
            var middleware=require('../lib/middleware/1_parse')
            var req={_event:event}
            var res={}
            var result=middleware(req,res)
            console.log(res)
            test.equal(typeof res.message,"string")
            test.done()
        },
        preprocess:test=>test.done(), 
        querySend:test=>test.done(), 
        queryPost:test=>test.done(), 
        hookSend:test=>test.done(), 
        hookPost:test=>test.done(), 
        assemble:test=>test.done() 
    },
    router:{
        setUp:function(done){
            this.run=function(router,test){
                return Promise.promisify(router.start)
                .bind(router)(_.cloneDeep(require('./lex')))
                .then(test.ok)
                .catch(test.ifError)
            }
            done()
        },
        empty:function(test){
            var router=new Router()
            router.add((res,req)=>{return {res,req:{out:true}}})
            this.run(router,test)
            .finally(test.done)
        },
        handle:function(test){
            var router=new Router()
            this.run(router,test)
            .finally(test.done)
        }
    },
    lex:function(test){
        run(require('./lex'),lexSchema,test)
    },
    alexa:{
        start:function(test){
            run(require('./alexa/start'),alexaSchema,test)
        },
        intent:function(test){
            run(require('./alexa/intent'),alexaSchema,test)
        },
        cancel:function(test){
            run(require('./alexa/cancel'),alexaSchema,test)
        },
        end:async function(test){
            var msg=await lambda(require('./alexa/end'))
            test.ok(!msg)
            test.done()
        }
    }
}
