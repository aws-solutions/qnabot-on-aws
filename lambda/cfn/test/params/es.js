/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var base=require('./base')
var Promise=require('bluebird')
var aws=require('../../lib/util/aws')
var s3=new aws.S3()
var outputs=require('../../../../bin/exports')

var setup=outputs('dev/domain').then(function(output){
    return {
        Address:output.Addresss,
        Index:'test-index',
        Name:'test-index-2',
        Type:{    
            _meta:{
                test:"a"
            },
            properties:{
                qid:{type:"keyword"}
            }
        }
    }
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("EsInit",stage,param))
}


