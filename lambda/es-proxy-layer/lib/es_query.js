
let request = require('./request');
let build_es_query = require('./esbodybuilder');
let _ = require('lodash')


async function run_query_es(req, query_params) {
    
    var es_query = await build_es_query(query_params);
    var es_response = await request({
        url: `https://${req._info.es.address}/${req._info.es.index}/_doc/_search?search_type=dfs_query_then_fetch`,
        method: "GET",
        body: es_query
    });
    
    if (_.get(es_response, "hits.hits[0]._source")) {
        _.set(es_response, "hits.hits[0]._source.answersource", "ElasticSearch");
    }

    return es_response;
}

async function run_qid_query_es(params, qid) {
    qnabot.log("run_query_es params: ", params);
    let question = "qid::"+qid;
    var es_query = await build_es_query({question:question});
    var es_response = await request({
        url: `https://${params.es_address}${params.es_path}`,
        method: "GET",
        body: es_query
    });
    qnabot.log("run_query_es result: ", JSON.stringify(es_response, null, 2));
    return es_response;
}

module.exports = {
    run_query_es:run_query_es,
    run_qid_query_es:run_qid_query_es
}