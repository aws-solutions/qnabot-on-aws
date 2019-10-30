//start connection
var _=require('lodash');
var request=require('./request');
var build_es_query=require('./esbodybuilder');
var handlebars=require('./handlebars');

function run_query(req, query_params){
    return(build_es_query(query_params))
    .then( function(es_query) {
        return request({
            url:`https://${req._info.es.address}/${req._info.es.index}/${req._info.es.type}/_search?search_type=dfs_query_then_fetch`,
            method:"GET",
            body:es_query
        });
    });  
}

function get_answer(req, res){
    var query_params = {
        question: req.question,
        topic: _.get(req,'session.topic',''),
        from: 0,
        size: 1,
        minimum_should_match: _.get(req,'_settings.ES_MINIMUM_SHOULD_MATCH'),
        use_keyword_filters: _.get(req,'_settings.ES_USE_KEYWORD_FILTERS'),
        keyword_syntax_types: _.get(req,'_settings.ES_KEYWORD_SYNTAX_TYPES'),
        syntax_confidence_limit: _.get(req,'_settings.ES_SYNTAX_CONFIDENCE_LIMIT'),
    };
    var no_hits_question = _.get(req,'_settings.ES_NO_HITS_QUESTION','no_hits');
    return(run_query(req, query_params))
    .then( function(response){
        var hit = _.get(response,"hits.hits[0]._source");
        if (hit){
            res['got_hits']=1;  // response flag, used in logging / kibana
            return response;
        } else {
            console.log("No hits from query - searching instead for: " + no_hits_question);
            query_params['question'] = no_hits_question;
            res['got_hits']=0;  // response flag, used in logging / kibana
            return run_query(req, query_params);
        }
    });
}

module.exports=function(req,res){
    console.log("REQ:",JSON.stringify(req,null,2));
    console.log("RES:",JSON.stringify(res,null,2));
    return(get_answer(req, res))
    .then(function(result){
        console.log("ES result:"+JSON.stringify(result,null,2));
        var hit=_.get(result,"hits.hits[0]._source");
        if(hit){
            res.result=handlebars(req,res,hit);
            res.type="PlainText"
            res.message=res.result.a
            res.plainMessage=res.result.a
            
            _.set(res,"session.appContext.altMessages",
                _.get(res,"result.alt",{})
            )

            if(req._event.outputDialogMode!=="Text"){
                if(_.get(res,"result.alt.ssml")){
                    res.type="SSML"
                    res.message=res.result.alt.ssml.replace(/\r?\n|\r/g,' ')
                }
            }
            console.log(res.message)
            var card=_.get(res,"result.r.title") ? res.result.r : null
            
            if(card){
                res.card.send=true
                res.card.title=_.get(card,'title')
                res.card.subTitle=_.get(card,'subTitle')
                res.card.imageUrl=_.get(card,'imageUrl')
                res.card.buttons=_.get(card,'buttons')
            }

            res.session.topic=_.get(res.result,"t")
            
            var navigationJson = _.get(res,"session.navigation",false)
            var previousQid = _.get(res,"session.previous.qid",false)
            var previousArray  = _.get(res,"session.navigation.previous",[])
            
            if(
                previousQid != _.get(res.result,"qid") && 
                _.get(navigationJson,"hasParent",true) == false && 
                req._info.es.type=='qna')
            {
                if(previousArray.length == 0){
                    previousArray.push(previousQid)
                }
                else if(previousArray[previousArray.length -1] != previousQid){
                    previousArray.push(previousQid)
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
                next:_.get(res.result,
                    "next",
                    _.get(res,"session.navigation.next","")
                ),
                previous:previousArray,
                hasParent:hasParent
            }
        }else{
            res.type="PlainText"
            res.message=_.get(req,'_settings.EMPTYMESSAGE','You stumped me!');
        }
        console.log("RESULT",JSON.stringify(req),JSON.stringify(res))
    })
}

