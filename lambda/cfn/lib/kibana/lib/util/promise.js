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
var aws=require('aws-sdk')

aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION || 'us-east-1'
aws.config.signatureVersion='v4'
var cw=new aws.CloudWatchLogs()

Promise.if=function(test,func){
    return Promise.resolve().if(test,func)
}

Promise.prototype.if=function(test,func){
    var self=this
    if(typeof test === 'function'){
        return self.then(function(result){
            return test(result) ? self.then(func) : self
        })
    }else{
        return test ? self.then(func) : self
    }
}

Promise.prototype.log=function(label){
    return this.tap(x=>console.log(label,x))
}
Promise.prototype.logCatch=function(label){
    return this.tapCatch(x=>console.log(label,x))
}
Promise.prototype.retry=function(fnc,retries=10){
    return this.then(function(results){
        return Promise.retry(()=>fnc(results),retries)
    })
}
Promise.retry=function(fnc,retries=10){
    return new Promise(function(res,rej){
        var next=function(count){
            console.log("retries left:"+count)
            fnc().then(res).catch(function(err){
                if(count>0){
                    return setTimeout(()=>next(--count),1000)
                }else{
                    rej(err)
                }
            })
        }
        next(retries)
    })
}
Promise.prototype.finish=function(cb,event,success=false){
    return this.then(()=>cb(null))
    .logCatch("Error")
    .catch(function(error){
        if(process.env.LOG_GROUP && process.env.LOG_STREAM){
            Promise.retry(()=>sendError(error,event))
            .finally(()=>cb(error))
        }else if(success){  
            Promise.try(()=>cb(null))
        }else{
            Promise.try(()=>cb(error.message))
        }
    })
}

var sendError=function(error,event){
    return cw.describeLogStreams({
        logGroupName:process.env.LOG_GROUP,
        logStreamNamePrefix:process.env.LOG_STREAM
    }).promise()
    .get("logStreams").get(0)
    .then(function(info){
        return cw.putLogEvents({
            logGroupName:process.env.LOG_GROUP, 
            logStreamName:process.env.LOG_STREAM,
            sequenceToken:info.uploadSequenceToken,
            logEvents:[{
                message: JSON.stringify({
                    error:error.message,
                    event
                }),
                timestamp: (new Date()).getTime()
            }]
        }).promise()
    })
}

module.exports=Promise
