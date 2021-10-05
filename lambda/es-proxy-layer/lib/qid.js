//start connection
var Promise=require('bluebird')
var bodybuilder = require('bodybuilder')
var aws=require('aws-sdk')
var url=require('url')
var _=require('lodash')
var myCredentials = new aws.EnvironmentCredentials('AWS'); 
var request=require('./request')
const qnabot = require("qnabot/logging")


module.exports=function(event,context,callback){
    var query
    qnabot.log("Qid",event.qid)
    switch(event.type){
        case "next":
            query=bodybuilder()
            .orFilter('term', 'next.keyword', event.qid)
		    .from(0)
		    .size(1)
            .build() 
            break;
        case "qid":
            query=bodybuilder()
            .orQuery('match','qid',event.qid)
            .from(0)
            .size(1)
            .build()
            break;
        default:
            query=bodybuilder()
            .orQuery('match','qid',event.qid)
            .from(0)
            .size(1)
            .build()
            break;
    }
    
    qnabot.log("ElasticSearch Query",JSON.stringify(query,null,2))
    return request({
        url:url.resolve(`https://${process.env.ES_ADDRESS}`,`/${process.env.ES_INDEX}/_search`),
        method:"GET",
        body:query
    })
    .then(function(result){
        qnabot.log("ES result:"+JSON.stringify(result,null,2))
        callback(null,_.get(result,"hits.hits[0]._source",{}))
    })
    .catch(callback)
    
}
