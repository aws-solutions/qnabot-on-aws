/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION

module.exports=function(index,type,name,address){
    console.log(address)
    var con=(require('./con.js'))(address)
    
    return con.tap(function(es){
        return es.indices.exists({
            index:index
        })
        .tap(console.log)
        .tap(function(exists){ 
            return !exists ? es.indices.create({
                index:index
            }) : null
        })
    })
    .tap(function(es){
        return es.indices.existsType({
            index:index,
            type:name
        })
        .tap(console.log)
        .tap(function(exists){ 
            var body={}
            if(!exists){
                return es.indices.putMapping({
                    index,
                    type:name,
                    body:JSON.parse(type)
                })
            }
        })
        .tapCatch(console.log)
        .tap(console.log)
    })
}

