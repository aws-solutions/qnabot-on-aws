// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const Promise=require('bluebird')
const aws=require('./aws')
const s3=new aws.S3()
const con=require('./connection')
const _=require('lodash')

module.exports=function(params){
    const es=con(params.address)
    const es_utterances=es.search({
        index:process.env.INDEX,
        scroll:'10s',
        body: {
            query: {match_all: {}}
        }
    })
    .then(function(results){
        const scroll_id=results._scroll_id
        const out=results.hits.hits
        return new Promise(function(resolve,reject){
            const next=function(){
                es.scroll({
                   scrollId:scroll_id,
                   scroll:'10s'
                })
                .then(function(scroll_results){
                    const hits=scroll_results.hits.hits
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

    const s3_utterances=s3.getObject({
        Bucket:process.env.UTTERANCE_BUCKET,
        Key:process.env.UTTERANCE_KEY
    }).promise().tap(console.log).then(x=>JSON.parse(x.Body.toString()))

    return Promise.join(es_utterances,s3_utterances)
    .then(utterances=>_.compact(_.uniq(_.flatten(utterances))))
}

