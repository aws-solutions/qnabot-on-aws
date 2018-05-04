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
var s3=new aws.S3()
var con=require('./connection')
var _=require('lodash')

module.exports=function(params){
    var es=con(params.address)
    var es_utterances=es.search({
        index:process.env.INDEX,
        scroll:'10s',
        body: {
            query: {match_all: {}}
        }
    })
    .then(function(results){
        var scroll_id=results._scroll_id
        var out=results.hits.hits
        return new Promise(function(resolve,reject){
            var next=function(){
                es.scroll({
                   scrollId:scroll_id,
                   scroll:'10s'
                })
                .then(function(scroll_results){
                    var hits=scroll_results.hits.hits
                    hits.forEach(x=>out.push(x))
                    hits.length ? next() : resolve(out)
                })
                .catch(reject)
            }
            next()
        })
    })
    .then(function(result){
        return _.compact(_.uniq(_.flatten(result
            .map(qa=>qa._source.questions ? qa._source.questions.map(y=>y.q) : [])
        )))
    })

    var s3_utterances=s3.getObject({
        Bucket:process.env.UTTERANCE_BUCKET,
        Key:process.env.UTTERANCE_KEY
    }).promise().tap(console.log).then(x=>JSON.parse(x.Body.toString()))

    return Promise.join(es_utterances,s3_utterances)
    .then(utterances=>_.compact(_.uniq(_.flatten(utterances))))
}

