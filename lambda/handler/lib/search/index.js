/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var _=require('lodash')

module.exports=function(params,es){
    return es.search({
        index: process.env.ES_INDEX,
        type: process.env.ES_TYPE,
        searchType:"dfs_query_then_fetch",
        body:{
            size:10,
            from:0,
            query: {
              bool: {
                should: [
                  {
                    multi_match: {
                        query: _.get(params,"Session.TopicContext",""),
                        fields : ["t"]
                    }
                  },
                  {                  
                    multi_match: {
                        query:params.Query,
                        fields : ["q^2","a"]
                    }
                  }
                ]
              }
            }
        }
    })
    .tap(response=>console.log("elasticsearch response",JSON.stringify(response,null,2)))
    .get("hits")
    .then(function(results){
        if(results.hits.length>0){
            var result=results.hits.hits[0]
            return  {
                'msg':result.body.a,
                'question':params.Query,
                'r':result.r,
                't':result.t
            }
        }else{
            return  {
                'msg':process.env.EMPTYMESSAGE,
                'question':params.Query
            }
        }
    })
}
