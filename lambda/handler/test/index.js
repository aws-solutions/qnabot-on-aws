/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var lambda=require('../bin/lambda.js')
var path=require('path')
var api_params=require('./params/api.json')

var run=function(params,test){
    return lambda(params)
        .tap(msg=>console.log(JSON.stringify(msg)))
        .tap(test.ok)
        .error(test.ifError)
        .catch(test.ifError)
        .finally(test.done)
}

module.exports={
    bot_status:function(test){
        var params={
            Command:"BOT_STATUS"
        }
        run(params,test)
    },
    bot_info:function(test){
        var params={
            Command:"BOT_INFO",
            botname:"bot",
            lambdaArn:"arn"
        }
        run(params,test)
    },
    export:function(test){
        var params={
            Command:"EXPORT"
        }
        run(params,test)
    },
    list:function(test){
        var params={
            Command:"LIST",
            From:0,
            Perpage:2
        }
        run(params,test)
    },
    listFilter:function(test){
        var params={
            Command:"LIST",
            From:0,
            Filter:'te.*',
            Perpage:2
        }
        run(params,test)
    },
    check:function(test){
        var params={
            Command:"CHECK",
            Id:"someting"
        }
        run(params,test)
    },
    lex:function(test){
        var params=require('./params/lex.json') 
        run(params,test)
    },
    alexa:function(test){
        var params=require('./params/alexa.json') 
        run(params,test)
    },
    search:function(test){
        var params={
            Command:"SEARCH",
            Query:"who"
        }
        run(params,test)
    },
    update:function(test){
        var params={
            Command:"UPDATE",
            Body:{
                q:["add","who","someother"],
                qid:"test",
                a:"yes",
                r:{
                    title:"something",
                    imageUrl:"somethingelse"
                }
            }
        }
        run(params,test)
    },
    add:function(test){
        var params={
            Command:"ADD",
            Body:[{
                q:["add","who","someother"],
                qid:"test",
                a:"yes",
                r:{
                    title:"something",
                    imageUrl:"somethingelse"
                }
            }]
        }
        run(params,test)
    },
    save:function(test){
        var params={
            Command:"SAVE"
        }
        run(params,test)
    },
    rm:function(test){
        var params={
            Command:"DELETE",
            Id:"test"
        }
        run(params,test)
    },
    
    ping:function(test){
        var params={
            Command:"PING"
        }
        run(params,test)
    }
}


