//start connection
var Promise=require('bluebird')
var aws=require('./aws')
var _=require('lodash')
var myCredentials = new aws.EnvironmentCredentials('AWS'); 
var es=require('elasticsearch').Client({
    requestTimeout:10*1000,
    pingTimeout:10*1000,
    hosts: process.env.ES_ADDRESS,
    connectionClass: require('http-aws-es'),
    defer: function () {
        return Promise.defer();
    },
    amazonES: {
        region: process.env.AWS_REGION,
        credentials: myCredentials
    }
})

module.exports=function(req,res){
    return es.search({
        index: process.env.ES_INDEX,
        type: process.env.ES_TYPE,
        searchType:"dfs_query_then_fetch",
        body:req._query
    })
    .tap(x=>console.log("ES result:"+JSON.stringify(x,null,2)))
    .then(function(result){
        res.result=result.hits.hits
        res.type="PlainText"
        res.message=_.get(result,"hits.hits[0]._source.a",process.env.EMPTYMESSAGE)
        var card=_.get(result,"hits.hits[0]._source.r") 

        if(_.get(card,'title')){
            res.card.send=true
            res.card.title=_.get(card,'title')
            res.card.text=_.get(card,'text')
            res.card.url=_.get(card,'url')
        }
        if(_.get(result,"hits.hits[0]._source.t")){
            res.session.topic=_.get(result,"hits.hits[0]._source.t")
        }else{
            delete res.session.topic
        }
        res.session.previous={
            qid:_.get(result,"hits.hits[0]._source.qid"),
            a:_.get(result,"hits.hits[0]._source.a"),
            q:req.question
        }
    })
}
