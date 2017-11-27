#! /usr/bin/env node

var Promise=require('bluebird')
var chalk=require('chalk')
var path=require('path')
var context={}

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


module.exports=function(handler,event){
    return Promise.try(function(){
        if(typeof(event)==="object"){
            return event
        }else if(typeof(event)==="function"){
            return event()
        }
    })
    .then(function(eve){
        return new Promise(function(res,rej){
            callback=function(err,message,data){
                if(err){
                    chalk.red("Error:"+err)
                    rej(err)
                }else{
                    console.log(chalk.blue("Success:"+JSON.stringify(message)))
                    console.log(chalk.blue("data:"+JSON.stringify(data)))
                    res(message)
                }
            }
            context.done=callback
            handler(eve,context,callback)
        })
    })
}




