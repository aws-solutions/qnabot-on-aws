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
var download=require('./export.js')
module.exports=function(params,es){
    return download(params,es)
    .then(function(dump){
        var tmp=dump.qa.map(qa=>qa.q)
        var tmp=[].concat.apply([],tmp)
        tmp=tmp.concat(require('./default-utterances.js'))
        return {
            utterances:tmp.filter(
                (val,index)=>tmp.indexOf(val)===index 
            ),
            botname:params.botname,
            lambdaArn:params.lambdaArn
        }
    })
}

