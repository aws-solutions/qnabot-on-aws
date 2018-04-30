//start connection
var Promise=require('bluebird')
var bodybuilder = require('bodybuilder')
var aws=require('aws-sdk')
var url=require('url')
var _=require('lodash')
var myCredentials = new aws.EnvironmentCredentials('AWS'); 
var request=require('./request')
var markdown=require('markdown').markdown

module.exports=function(req,res){
    console.log(JSON.stringify({req,res},null,2))
    var query=bodybuilder()
    .orQuery('nested',{
        path:'questions',
        score_mode:'sum',
        boost:2},
        q=>q.query('match','questions.q',req.question)
    )
    .orQuery('match','a',req.question)
    .orQuery('match','t',_.get(req,'session.topic',''))
    .from(0)
    .size(1)
    .build()

    console.log("ElasticSearch Query",JSON.stringify(query,null,2))
    return request({
        url:`https://${req._info.es.address}/${req._info.es.index}/${req._info.es.type}/_search?search_type=dfs_query_then_fetch`,
        method:"GET",
        body:query
    })
    .then(function(result){
        console.log("ES result:"+JSON.stringify(result,null,2))
        res.result=_.get(result,"hits.hits[0]._source")
        if(res.result){
            res.type="PlainText"
            res.message=res.result.a
            _.set(res,"session.appContext.altMessages",
                _.get(res,"result.alt",{})
            )
            if(req.outputDialogMode!=="Text"){
                if(res.result.ssml){
                    res.type="SSML"
                    res.message=res.result.ssml
                }
            }
            console.log(res.message)
            var card=_.get(res,"result.r.title") ? res.result.r : null
            
            if(card){
                res.card.send=true
                res.card.title=_.get(card,'title')
                res.card.subTitle=_.get(card,'subTitle')
                res.card.imageUrl=_.get(card,'imageUrl')
            }

            res.session.topic=_.get(res.result,"t")
            var navigationJson = _.get(res.session,"navigation",false)
            if(navigationJson){
                navigationJson= JSON.parse(res.session.navigation)
            }
            var previousJson = _.get(res.session,"previous",false)
            if(previousJson){
                previousJson= JSON.parse(res.session.previous)
            }
            var previousArray = _.get(navigationJson,"previous",[])
            var hasPreviousQid = _.get(previousJson,"qid",false)
            console.log("hasParent: " + _.get(navigationJson,"hasParent",true))
            // Only push the previous Document qid onto the stack if there is one and if it's not the same Document that was just called and its a qna type document
            if(hasPreviousQid && hasPreviousQid != _.get(res.result,"qid") && _.get(navigationJson,"hasParent",true) == false && req._info.es.type=='qna'){
                if(previousArray.length == 0){
                    previousArray.push(hasPreviousQid)
                }
                else if(previousArray[previousArray.length -1] != hasPreviousQid){
                    previousArray.push(hasPreviousQid)
                }
            }
            if(previousArray.length > 10){
                previousArray.shift()
            }
            var hasParent = true
            if("next" in res.result){
                hasParent = false
            }
            
            res.session.previous={    
                qid:_.get(res.result,"qid"),
                a:_.get(res.result,"a"),
                alt:_.get(res.result,"alt",{}),
                q:req.question
            }
            res.session.navigation={
                next:_.get(res.result,"next",_.get(navigationJson,"next","")),
                previous:previousArray,
                hasParent:hasParent
            }
        }else{
            res.type="PlainText"
            res.message=process.env.EMPTYMESSAGE
        }
        console.log("RESULT",JSON.stringify(req),JSON.stringify(res))
    })
}
