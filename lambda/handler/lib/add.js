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

    return Promise.map(
        params.Body,
        function(body){
            var params={
                index: process.env.ES_INDEX,
                type: process.env.ES_TYPE,
                id:body.qid,
                body:body
            }
            console.log("es-request:",params)
            return es.index(params)
        }
    )
    .tap(x=>console.log("es-response:",x))
    .map(function(es_response){
        return {
            id:es_response._id,
            version:es_response._version,
            created:es_response.created
        }
    })
}



