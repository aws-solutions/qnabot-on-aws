//start connection
var Promise=require('bluebird');
var bodybuilder = require('bodybuilder');
var get_keywords=require('./keywords');
var _=require('lodash');


function build_qid_query(params) { 
    console.log("Build_qid_query - params: ",JSON.stringify(params,null,2));
    var query=bodybuilder()
            .orQuery('match','qid',params.qid)
            .from(0)
            .size(1)
            .build();
    console.log("ElasticSearch Query",JSON.stringify(query,null,2));
    return new Promise.resolve(query);
}


function build_query(params) {
    console.log("Build_query - params: ",JSON.stringify(params,null,2));
    return(get_keywords(params))
    .then(function(keywords) {
        var filter_query = {
            	'quniqueterms':{
                	query: keywords,
                    minimum_should_match: _.get(params,'minimum_should_match','2<75%'),
                    zero_terms_query: 'all',
                }
        	};
        var match_query = {
            	'quniqueterms':{
                	query: params.question,
                    boost:2,
                }
            };
        if (_.get(params, 'fuzziness')) {
            filter_query.quniqueterms.fuzziness = "AUTO";
            match_query.quniqueterms.fuzziness = "AUTO";
        }
        var query=bodybuilder();
        if (keywords.length > 0) {
            query = query.filter(
            	'match', filter_query
            );          
        }
        query = query.orQuery(
            'match', match_query
        ) ;
        query = query.orQuery(
            'nested',{
            score_mode:'max',
            boost:_.get(params,'phrase_boost',4),
            path:'questions'},
            q=>q.query('match_phrase','questions.q',params.question)
        ) ;
        if (_.get(params, 'score_answer_field')) {
            query = query.orQuery('match','a',params.question) ;  
        }
        query = query.orQuery('match','t',_.get(params,'topic',''))
        .from(_.get(params,'from',0))
        .size(_.get(params,'size',1))
        .build();
        console.log("ElasticSearch Query",JSON.stringify(query,null,2));
        return new Promise.resolve(query);
    });
}


module.exports=function(params){
    // if question starts with "QID::" then build a Qid targeted query, else build question matching query.
    if (params.question.toLowerCase().startsWith("qid::")) {
        // question specifies targeted Qid
        params.qid = params.question.split("::")[1] ;
        return build_qid_query(params);
    } else {
        return build_query(params);
    }
};


/*
var testparams = {
    question: "what is an example user question",
    topic: "optional_topic",
    from: 0,
    size: 0
};
build_query(testparams)
*/