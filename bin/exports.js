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
var config=require('../config')
var fs=require('fs')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.profile
var aws=require('aws-sdk')
var Promise=require('bluebird')
aws.config.setPromisesDependency(Promise)
aws.config.region=require('../config').region
var name=require('./name')
var launch=require('./launch')
var _=require('lodash')
var cf=new aws.CloudFormation()

module.exports=_.memoize(function(stack,options={}){
    if(!stack){

        var exports={}
        
        return cf.listExports().promise()
        .get('Exports')
        .each(exp=>exports[exp.Name]=exp.Value)
        .return(exports)
    }else{
        var outputs={}
        return new Promise(function(res,rej){
            next()
            function next(){
                cf.describeStacks({
                    StackName:name(stack,{})
                }).promise()
                .catch(x=>x.message.match(/does not exist/),
                    ()=>launch.sure(stack,{wait:true})
                    .then(()=>cf.describeStacks({
                        StackName:name(stack,{})
                    }).promise())
                )
                .then(function(result){
                    var stack=result.Stacks[0]
                    if(["CREATE_COMPLETE",
                        "UPDATE_COMPLETE",
                        "UPDATE_ROLLBACK_COMPLETE"
                        ].includes(stack.StackStatus)){
                        res(result)
                    }else if([
                        "CREATE_IN_PROGRESS",
                        "UPDATE_IN_PROGRESS",
                        "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",
                        "UPDATE_ROLLBACK_IN_PROGRESS",
                        "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
                        "REVIEW_IN_PROGRESS"
                        ].includes(stack.StackStatus)){
                        setTimeout(()=>next(),5*1000)
                    }else{
                        rej(stack.StackStatus)
                    }
                })
            }
        })
        .then(x=>x.Stacks[0].Outputs)
        .map(x=>outputs[x.OutputKey]=x.OutputValue)
        .return(outputs)
    }
},(stack,options)=>stack)

if(!module.parent){
    module.exports(process.argv[2],{silent:true,quick:true})
    .then(exports=>console.log(JSON.stringify(exports,null,4)))
    .catch(x=>console.log("error"+x))
}


