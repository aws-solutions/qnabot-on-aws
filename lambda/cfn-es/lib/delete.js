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


module.exports=function(index,type,address){
    var con=(require('./con.js'))(address)
    return con.tap(function(es){
        return es.indices.exists({
            index:index
        })
        .tap(console.log)
        .tap(function(exists){ 
            return exists ? es.indices.delete({
                index:index
            }) : null
        })
        .tap(console.log)
    })
}
