//start connection
var Promise=require('bluebird');
var bodybuilder = require('bodybuilder');
var get_keywords=require('./keywords');
var _=require('lodash');


var minimum_should_match = process.env.ES_KEYWORDS_MINIMUM_SHOULD_MATCH || '2<75%';

function build_query(params) {
    return(get_keywords(params))
    .then(function(keywords) {
        var query=bodybuilder();
        if (keywords.length > 0) {
            query = query.filter(
      			'nested',{
      				path:'questions',
      				query: {
                    	match:{
                        	'questions.q':{
                            	query: keywords,
                                minimum_should_match: minimum_should_match,
                                zero_terms_query: 'all'
                            }
                        }
                	}
    			}
            );          
        } 
        query = query.orQuery(
            'nested',{
            score_mode:'sum',
            boost:2,
            path:'questions'},
            q=>q.query('match','questions.q',params.question)
        )
        .orQuery('match','a',params.question)
        .orQuery('match','t',_.get(params,'topic',''))
        .from(_.get(params,'from',0))
        .size(_.get(params,'size',1))
        .build();
        console.log("ElasticSearch Query",JSON.stringify(query,null,2));
        return new Promise.resolve(query);
    });
}


module.exports=function(params){
    return build_query(params);
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