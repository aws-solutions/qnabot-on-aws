/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var size=10
var Promise=require('bluebird')

module.exports=function(params,es){
    var index=parseInt(params.From)*size
    console.log(index)
    
    

    return es.exists({
        index: process.env.ES_INDEX,
        type: process.env.ES_TYPE,
        id:params.Id
    })
    .tap(console.log)
    .then(val=> val ? Promise.resolve() : Promise.reject('Error'))
}

