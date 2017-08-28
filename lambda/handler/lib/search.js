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

module.exports=function(params,es){
    var index=parseInt(params.From)*size
    console.log(index)

    var body={
        size:size,
        from:index || 0,
        query: {
            multi_match: {
                query:params.Query,
                fields : ["q^2","a"]
            }
        }
    }

    console.log(JSON.stringify(body,null,4))
    return es.search({
        index: process.env.ES_INDEX,
        type: process.env.ES_TYPE,
        searchType:"dfs_query_then_fetch",
        body
    })
    .tap(response=>console.log("elasticsearch response",JSON.stringify(response,null,2)))
    .get("hits")
    .then(function(result){
        if(result.hits){
            return {
                qa:result.hits.map(qa=>{return {
                        id:qa._id,
                        score:qa._score,
                        body:qa._source
                    }
                }),
                total:result.total
            }
        }
    })
    .then(function(results){
        if(process.env.TYPE==="API"){
            return results
        }else{
            if(results.qa.length>0){
                return  {
                    'msg':results.qa[0].body.a,
                    'question':params.Query,
                    'r':results.qa[0].body.r 
                }
            }else{
                return  {
                    'msg':process.env.EMPTYMESSAGE,
                    'question':params.Query
                }
            }
        }
    })
}
