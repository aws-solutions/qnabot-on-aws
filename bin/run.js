#! /usr/bin/env node
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
var chalk=require('chalk')
var path=require('path')
var mock=require('./mock')
var context={}
process.env.AWS_PROFILE=require('../config').profile
process.env.AWS_DEFAULT_REGION=require('../config').profile

context.callbackWaitsForEmptyEventLoop = true;
context.functionName = '';
context.functionVersion = '1';
context.invokedFunctionArn = 'arn:aws:lambda:us-east-1:123456:function:function-name';
context.memoryLimitInMB = 1;
context.awsRequestId = '';
context.logGroupName = 'a';
context.logStreamName = null;
context.identity = null;
context.clientcontext = null;

var server=mock()

callback=function(err,message,data){
    if(err){
        chalk.red("Error:"+err)
    }else{
        console.log(chalk.blue("Success:"+JSON.stringify(message)))
        console.log(chalk.blue("data:"+JSON.stringify(data)))
    }
    server.close()
}

context.done=callback

module.exports=function(handler,eve){
    return Promise.try(function(){
        process.env.REGION='us-east-1' 
        if(typeof(event)==="object"){
            return event
        }else if(typeof(event)==="function"){
            return event()
        }
    })
    .then(ev=>handler(eve,context,callback))
}

if(!module.parent){
    var argv = require('optimist').argv;
    var dir=path.join(__dirname,'..','lambda',argv._[0])
    var event=require(path.join(dir,'test'))
    var handler=require(path.join(dir,'index.js')).handler
    
    module.exports(handler,event)
}

