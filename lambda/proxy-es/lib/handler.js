var Url=require('url');
var Promise=require('bluebird');
var request=require('./request');
var _=require('lodash');
var build_es_query=require('./esbodybuilder');
var kendra = require('./kendraQuery');
var AWS=require('aws-sdk');

async function get_parameter(param_name) {
    var ssm = new AWS.SSM();
    var params = {
        Name: param_name,
    };
    var response = await ssm.getParameter(params).promise();
    var settings = JSON.parse(response.Parameter.Value); 
    return settings;
}

async function get_settings() {
    var default_settings_param = process.env.DEFAULT_SETTINGS_PARAM;
    var custom_settings_param = process.env.CUSTOM_SETTINGS_PARAM;

    console.log("Getting Default QnABot settings from SSM Parameter Store: ", default_settings_param);
    var default_settings = await get_parameter(default_settings_param);
    
    console.log("Getting Custom QnABot settings from SSM Parameter Store: ", custom_settings_param);
    var custom_settings = await get_parameter(custom_settings_param);

    var settings = _.merge(default_settings, custom_settings);
    console.log("Merged Settings: ", settings);
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
            phrase_boost: _.get(settings, 'ES_PHRASE_BOOST'),
            use_keyword_filters: _.get(settings,'ES_USE_KEYWORD_FILTERS'),
            keyword_syntax_types: _.get(settings,'ES_KEYWORD_SYNTAX_TYPES'),
            syntax_confidence_limit: _.get(settings,'ES_SYNTAX_CONFIDENCE_LIMIT'),
            score_answer_field: _.get(settings,'ES_SCORE_ANSWER_FIELD'),
            fuzziness: _.get(settings, 'ES_USE_FUZZY_MATCH'),
        };
        return build_es_query(query_params);
    } else {
        return Promise.resolve(event.body);
    }
}



async function run_query_es(event) {
    console.log("ElasticSearch Query",JSON.stringify(es_query,null,2));
    var es_query = await build_es_query(event);
    var es_response = await request({
        url:Url.resolve("https://"+event.endpoint,event.path),
        method:event.method,
        headers:event.headers,
        body:es_query 
    });
    if (_.get(es_response, "hits.hits[0]._source")) {
        _.set(es_response, "hits.hits[0]._source.answersource", "ElasticSearch");
    }
    return es_response;
}


async function run_query_kendra(event, kendra_index) {
    console.log("Kendra FAQ Query index:" + kendra_index);
    // calls kendrQuery function which duplicates KendraFallback code, but only searches through FAQs
    var request_params = {
        kendra_faq_index:kendra_index,
        input_transcript:event.question
    }
    var kendra_response = await kendra.handler(request_params);
    
    if (_.get(kendra_response, "hits.hits[0]._source")) {
        _.set(kendra_response, "hits.hits[0]._source.answersource", "Kendra FAQ");
    }
    return kendra_response;
}




module.exports= async (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        var settings = await get_settings();
        var kendra_index = _.get(settings, "KENDRA_FAQ_INDEX")
        // if test mode & kendra index exists, then test with kendra faq query
        if (_.get(event,'mode',"")=="test" && kendra_index != "") {
            var response = await run_query_kendra(event, kendra_index);
            // ES fallback if KendraFAQ fails
            var hit = _.get(response, "hits.hits[0]._source");
            if (!hit && _.get(settings, 'ES_FALLBACK', false)) {
                console.log("ES Fallback");
                response = await run_query_es(event);
                if (_.get(response, "hits.hits[0]._source")) {
                    _.set(response, "hits.hits[0]._source.answersource", "ES Fallback");
                }
            }
        } else {
            var response = await run_query_es(event);
        }
        
        console.log("Query response: ", JSON.stringify(response,null,2));
        return callback(null, response);
    } catch (error) {
        console.log(`error is ${JSON.stringify(error, null,2)}`);
        return callback(JSON.stringify({
            type:error.response.status===404 ? "[NotFound]":"[InternalServiceError]",
            status:error.response.status,
            message:error.response.statusText,
            data:error.response.data
        }))
    }
}



module.exports2= (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    return(Promise.resolve(get_es_query(event)))
    .then( function(es_query) {
        console.log("ElasticSearch Query",JSON.stringify(es_query,null,2));
        return request({
            url:Url.resolve("https://"+event.endpoint,event.path),
            method:event.method,
            headers:event.headers,
            body:es_query 
        });
    })
    .tap(x=>console.log(JSON.stringify(x)))
    .tapCatch(x=>console.log(x))
    .then(result=>callback(null,result))
    .catch(error=>callback(JSON.stringify({
        type:error.response.status===404 ? "[NotFound]" : "[InternalServiceError]",
        status:error.response.status,
        message:error.response.statusText,
        data:error.response.data
    })));
};
