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
var con=require('./con')
var _=require('lodash')

module.exports=function(params){
    var es=con(params.address)

    return es.search({
        index: params.index,
        type: params.type,
        scroll:'10s',
        body: {
            query: {match_all: {}}
        }
    })
    .then(function(results){
        var scroll_id=results._scroll_id
        var results=results.hits.hits

        return new Promise(function(resolve,reject){
            var next=function(){
                es.scroll({
                   scrollId:scroll_id,
                   scroll:'10s'
                })
                .then(function(scroll_results){
                    var hits=scroll_results.hits.hits
                    hits.forEach(x=>results.push(x))
                    hits.length ? next() : resolve(results)
                })
                .catch(reject)
            }
            next()
        })
    })
    .then(function(result){
        return _.compact(_.uniq(_.flatten(result.map(qa=>qa._source.q))))
    })
}

