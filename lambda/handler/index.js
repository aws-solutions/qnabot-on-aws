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
var Promise=require('bluebird')
var parse=require('./lib/parse')
var lib=require('./lib')
var response=require('./lib/response')

var es = require('./lib/con.js')()

var make_callback=function(cb){
    return function(err,msg){
        console.log("Err:"+err)
        console.log("Msg:"+JSON.stringify(msg))
        cb(err,msg)
    }
}

exports.handler=function(event,context,cb){
    console.log(event)
    var callback=make_callback(cb) 
    var params

    return es.ping()
    .tap(console.log)
    .then(function(e){
        params=parse(event)
        console.log(params)
        return lib[params.Command](params,es)
    })
    .then(msg=>callback(null,response.success(msg,params)))
    .error(err=>callback(response.error(err,params)))
    .catch(err=>callback(response.error(err,params)))
}



