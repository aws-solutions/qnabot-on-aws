
let request = require('./request');
let build_es_query = require('./esbodybuilder');
let _ = require('lodash')
const qnabot = require("qnabot/logging")

async function  isESonly(req, query_params) {
    // returns boolean whether question is supported only on ElasticSearch
    // no_hits is ES only

    var no_hits_question = _.get(req, '_settings.ES_NO_HITS_QUESTION', 'no_hits');
    var ES_only_questions = [no_hits_question];
    if (ES_only_questions.includes(query_params['question'])) {
        return true
    }
    // QID querying is ES only
    if (query_params.question.toLowerCase().startsWith("qid::")) {
        return true
    }
    // setting topics is ES only
    if (_.get(query_params, 'topic')!="") {
        return true
    }
    // setting clientFilterValues should block Kendra FAQ indexing
    if (_.get(query_params, 'qnaClientFilter')) {
        return true
    }    
    if (_.get(query_params, 'kendraIndex') == "") {
        return true
    } 
    //Don't send one word questions to Kendra
    if(query_params.question.split(" ").length  < 2){

        return true;
    }

    return false;
}


async function run_query_es(req, query_params) {
    
    var es_query = await build_es_query(query_params);
    var es_response = await request({
        url: `https://${req._info.es.address}/${req._info.es.index}/_search?search_type=dfs_query_then_fetch`,
        method: "GET",
        body: es_query
    });

    qnabot.log(`Response from run_query_es => ${JSON.stringify(es_response)}` )

    if (_.get(es_response, "hits.hits[0]._source")) {
        _.set(es_response, "hits.hits[0]._source.answersource", "ElasticSearch");
    }  

    if (_.get(query_params, 'settings.EMBEDDINGS_API') != "DISABLED") {
        let threshold = _.get(query_params,'settings.EMBEDDINGS_SCORE_THRESHOLD',0);
        if (_.get(es_response, "hits.max_score", 0) <= threshold) {
            qnabot.log(`Max score is ${threshold} or less for embeddings query - no valid results. Remove hits.`)
            _.set(es_response, "hits.hits", [])
        }
    } else {
        let threshold = 1;
        if (_.get(es_response, "hits.max_score", 0) <= threshold) {
            qnabot.log(`Max score is ${threshold} or less for non embeddings query - no valid results. Remove hits.`)
            _.set(es_response, "hits.hits", [])
        }
    }

    return es_response;
}

async function run_qid_query_es(params, qid) {
    qnabot.log("run_qid_query_es params: ", params);
    let question = "qid::"+qid;
    var es_query = await build_es_query({question:question});
    var es_response = await request({
        url: `https://${params.es_address}${params.es_path}`,
        method: "GET",
        body: es_query
    });
    qnabot.log("run_qid_query_es result: ", JSON.stringify(es_response, null, 2));
    return es_response;
}

/** Function that returns if a string has JSON structure
 * @param str - input string
 * @returns boolean true or false
 */
 function hasJsonStructure(str) {
    if (typeof str !== 'string') return false;
    try {
        const result = JSON.parse(str);
        const type = Object.prototype.toString.call(result);
        return type === '[object Object]' 
            || type === '[object Array]';
    } catch (err) {
        return false;
    }
}

function isQuestionAllStopwords(question) {
    let stopwords = "a,an,and,are,as,at,be,but,by,for,if,in,into,is,it,not,of,on,or,such,that,the,their,then,there,these,they,this,to,was,will,with".split(",");
    let questionwords = question.toLowerCase().split(/\s+/)
    let allStopwords = questionwords.every( x => { return stopwords.includes(x); });
    return allStopwords;
}

module.exports = {
    run_query_es:run_query_es,
    run_qid_query_es:run_qid_query_es,
    hasJsonStructure:hasJsonStructure,
    isESonly:isESonly,
    isQuestionAllStopwords:isQuestionAllStopwords
}