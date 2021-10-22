// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const Promise=require('bluebird')
const AWS = require('./aws.js');
const myCredentials = new AWS.EnvironmentCredentials('AWS');
const _=require('lodash')
const s3=new AWS.S3()
const qnabot = require("qnabot/logging")



var con=_.memoize(function(esAddress){
    let opts = {
        requestTimeout:10*1000,
        pingTimeout:10*1000,
        hosts:esAddress,
        connectionClass: require('http-aws-es'),
        defer: function () {
            return Promise.defer();
        },
        amazonES: {
            region: process.env.AWS_REGION,
            credentials: myCredentials
        }
    }
    let es=require('elasticsearch').Client(opts)
    return es
})

module.exports=async function(event,context,callback){
    try{
        const es=con(process.env.ES_ADDRESS)
        const es_utterances=es.search({
            index:process.env.ES_INDEX,
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
        }).promise().tap(qnabot.log).then(x=>JSON.parse(x.Body.toString()))
    
        return Promise.join(es_utterances,s3_utterances)
        .then(utterances=>{
            return {utterances:_.compact(_.uniq(_.flatten(utterances)))}
        })
    }catch(e){
        qnabot.log(e)
        callback(e)
    }
}





