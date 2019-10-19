var Url=require('url');
var Promise=require('bluebird');
var request=require('./request');
var _=require('lodash');
var build_es_query=require('./esbodybuilder');
var AWS=require('aws-sdk');

async function get_settings() {
    var settings_param = process.env.SETTINGS_PARAM;
    var ssm = new AWS.SSM();
    var params = {
        Name: settings_param,
    };
    console.log("Getting QnABot settings from SSM Parameter Store: ", settings_param);
    var response = await ssm.getParameter(params).promise();
    var settings = JSON.parse(response.Parameter.Value);
    console.log("Settings: ", settings);
    return settings;    
}

async function get_es_query(event) {
    var settings = await get_settings();
    var question = _.get(event,'question','');
    if (question.length > 0) {
        var query_params = {
            question: question,
            topic: _.get(event,'topic',''),
            from: _.get(event,'from',0),
            size: _.get(event,'size',1),
            minimum_should_match: _.get(settings,'ES_MINIMUM_SHOULD_MATCH'),
            use_keyword_filters: _.get(settings,'ES_USE_KEYWORD_FILTERS'),
            keyword_syntax_types: _.get(settings,'ES_KEYWORD_SYNTAX_TYPES'),
            syntax_confidence_limit: _.get(settings,'ES_SYNTAX_CONFIDENCE_LIMIT'),
        };
        return build_es_query(query_params);
    } else {
        return Promise.resolve(event.body);
    }
}

module.exports= (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    return(Promise.resolve(get_es_query(event)))
    .then( function(es_query) {
        console.log("ElasticSearch Query",JSON.stringify(es_query,null,2));
        return request({
            url:Url.resolve("https://"+event.endpoint,event.path),
            method:event.method,
            body:es_query 
        });
    })
    .tap(x=>console.log(JSON.stringify(x)))
    .tapCatch(x=>console.log(x))
    .then(result=>callback(null,result))
    .catch(error=>callback(JSON.stringify({
        type:error.response.status===404 ? "[NotFoud]" : "[InternalServiceError]",
        status:error.response.status,
        message:error.response.statusText,
        data:error.response.data
    })));
};
