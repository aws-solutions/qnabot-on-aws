//start connection
var Promise=require('bluebird')
var bodybuilder = require('bodybuilder')
var aws=require('aws-sdk')
var url=require('url')
var _=require('lodash')
var myCredentials = new aws.EnvironmentCredentials('AWS'); 
var request=require('./request')

module.exports=function(event,context,callback){

    sendDelete('metrics',process.env.METRICS_DELETE_RANGE_MINUTES,callback)
    sendDelete('feedback',process.env.FEEDBACK_DELETE_RANGE_MINUTES,callback)
    return event
}

function sendDelete(indexName,timeBack,callback) {

    var query
    query=bodybuilder()
            .query('range', 'datetime', 
                {
                    "lt" : `now-${timeBack}m`
                })
            .build()
    console.log("ElasticSearch Query",JSON.stringify(query,null,2))
    return request({
        url:url.resolve(`https://${process.env.ES_ADDRESS}`,`/${process.env.ES_INDEX}-${indexName}/_delete_by_query`),
        method:"POST",
        body:query
    })
    .then(function(result){
        console.log("ES result:"+JSON.stringify(result,null,2))
        callback(null,_.get(result,"hits.hits[0]._source",{}))
    })
    .catch(callback)
}
