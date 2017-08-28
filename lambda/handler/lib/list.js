/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

module.exports=function(params,es){
    var size=params.Perpage || 10
    var index=parseInt(params.From || 0 )*size
    console.log(index)
    
    var query={
        index: process.env.ES_INDEX,
        type: process.env.ES_TYPE,
        body: {
            size:size,
            from:index,
            query: {
                match_all: {}
            },
            sort:{
                qid:{
                    order:"asc"
                }
            }
        }
    }

    if(params.Filter){
        query.body.query={
            bool:{
                must:{match_all:{}},
                filter:{regexp:{
                    "qid":params.Filter
                }}
            }
        }
    }

    console.log(JSON.stringify(query,null,2))
    return es.search(query)
    .tap(re=>console.log(JSON.stringify(re,null,2)))
    .get("hits")
    .then(function(result){
        console.log(result)
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
}

