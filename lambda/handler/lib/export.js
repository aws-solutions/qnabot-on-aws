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

module.exports=function(params,es){
    return es.search({
        index: process.env.ES_INDEX,
        type: process.env.ES_TYPE,
        scroll:'10s',
        body: {
            query: {match_all: {}}
        }
    })
    .tap(re=>console.log(JSON.stringify(re,null,2)))
    .then(function(init_results){
        var scroll_id=init_results._scroll_id
        var results=init_results.hits.hits
        return new Promise(function(resolve,reject){
            var next=function(){
                es.scroll({
                   scrollId:scroll_id,
                   scroll:'10s'
                })
                .then(function(scroll_results){
                    if(scroll_results.hits.hits.length>0){
                        scroll_results.hits.hits.forEach(x=>results.push(x))
                        next()
                    }else{
                        resolve(results)
                    }
                })
                .error(reject)
            }
            next()
        })
    })
    .then(function(result){
        return {
            qa:result.map(qa=>{return qa._source}),
            total:result.total
        }
    })
}

