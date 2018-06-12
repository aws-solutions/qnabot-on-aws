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

var Promise=require('./util/promise')
var elasticsearch=require('elasticsearch')
var aws = require('./util/aws');

module.exports=function(address){
    return Promise.promisify(aws.config.getCredentials).bind(aws.config)()
    .then(function(){
        return new Promise(function(res,rej){
            var next=function(count){
                var client=require('elasticsearch').Client({
                    hosts: address,
                    pingTimeout:60*1000,
                    requestTimeout:60*1000,
                    connectionClass: require('http-aws-es'),
                    defer: function () {
                        return Promise.defer();
                    },
                    amazonES: {
                        region: process.env.AWS_REGION,
                        credentials: aws.config.credentials
                    }
                })
                
                Promise.resolve(client)
                .tap(es=>es.ping())
                .tap(res)
                .catch(function(err){
                    console.log("Connection Error")
                    return count >0 ? setTimeout(()=>next(count--),1000) : rej("Failed to connect")
                })
            }
            next(10)
        })
    })
}

