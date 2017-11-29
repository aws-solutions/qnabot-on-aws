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
var aws=require('./aws')

module.exports=function(params,es){

    return es.delete({
        index: process.env.ES_INDEX,
        type: process.env.ES_TYPE,
        refresh:"true",
        id:params.ID
    })
    .catch(function(err){
        console.log(err)
        if(!err.body.found){
            return Promise.resolve("success")
        }else{
            return Promise.reject(err)
        }
    })
    .tap(console.log)
    .return('success')
}


