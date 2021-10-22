// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var lambda=require('./setup.js')
const setupenv=require('./setupenv.js')
var Promise=require('bluebird')
var _=require('lodash')
const qnabot = require("qnabot/logging")


var Ajv=require('ajv')
var ajv=new Ajv()
var lexSchema=ajv.compile(require('./lex/schema'))
var alexaSchema=ajv.compile(require('./alexa/schema'))
process.env.EMPTYMESSAGE="empty"

var run=function(params,schema,test){
    return lambda(params)
        .tap(msg=>qnabot.log(JSON.stringify(msg)))
        .tapCatch(msg=>qnabot.log(JSON.stringify(msg)))
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
        setUp:function(done){
            setupenv()
                .tap(msg=>{
                    done()
                })
        },
        parse:test=>{
            var event=require('./lex')
            var middleware=require('../lib/middleware/1_parse.js')
            var req={_event:event}
            var res={}
            middleware(req,res)
                .then(msg=>{
                    test.equal(typeof res.message,"string")
                    test.done()
                })
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
        // TODO: Fix the alexa intent test
        //intent:function(test){
        //    run(require('./alexa/intent'),alexaSchema,test)
        //},
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
