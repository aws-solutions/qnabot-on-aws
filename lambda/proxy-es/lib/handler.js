var Url=require('url');
var Promise=require('bluebird');
var request=require('./request');
var build_es_query=require('./esbodybuilder');

function get_es_query(event) {
    if (event.question.length > 0) {
        var query_params = {
            question: event.question,
            topic: event.topic,
            from: event.from,
            size: event.size
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
