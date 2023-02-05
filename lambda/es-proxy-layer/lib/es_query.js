
let request = require('./request');
let build_es_query = require('./esbodybuilder');
let hits_topic_tiebreaker=require('./hits_topic_tiebreaker')
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
    // setting score_answer should block Kendra FAQ indexing
    if (_.get(query_params, 'score_answer')) {
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


function score_threshold_check(resp, threshold) {
    const max_score = _.get(resp, "hits.max_score", 0);
    if (max_score <= threshold) {
        qnabot.log(`Max score is ${max_score} - less than threshold ${threshold} - no valid results. Remove hits.`)
        _.set(resp, "hits.hits", [])
    }
    return resp;
}

async function run_query_es(req, query_params) {
    // if size is 1, change to 10 to allow for topic tiebreaking on results before choosing top hit
    const size = query_params.size ;
    if (size == 1) {
        query_params.size = 10;
    }

    // build query to check for match on stored questions (default)
    const es_query = await build_es_query(query_params);
    let es_response = await request({
        url: `https://${req._info.es.address}/${req._info.es.index}/_search?search_type=dfs_query_then_fetch`,
        method: "GET",
        body: es_query
    });

    // check threshold - always '1' is not using embeddings
    let threshold = (_.get(query_params, 'settings.EMBEDDINGS_ENABLE')) ? _.get(query_params,'settings.EMBEDDINGS_SCORE_THRESHOLD',0) : 1
    qnabot.log(`Score threshold for question matches is: ${threshold}.`)
    es_response = score_threshold_check(es_response, threshold)
    let gothits = _.get(es_response, 'hits.hits.length');
    let matched_field;
    if (query_params.question.toLowerCase().startsWith("qid::")) {
        matched_field = (gothits) ? "QID" : "";
    } else {
        matched_field = (gothits) ? "questions" : "";
    }

    // if ES_SCORE_ANSWER_MODE is true, AND no hits were returned from default "questions" query, run 
    // second query to match the item answers field.
    if ( !gothits && _.get(query_params, 'settings.ES_SCORE_ANSWER_FIELD')) {
        qnabot.log("ES_SCORE_ANSWER_FIELD is true. Rerun query to check for matches on answer field.")
        query_params.score_answer = true;
        let es_query_an_answer = await build_es_query(query_params);
        es_response = await request({
            url: `https://${req._info.es.address}/${req._info.es.index}/_search?search_type=dfs_query_then_fetch`,
            method: "GET",
            body: es_query_an_answer
        });
        // check threshold - always '1' is not using embeddings
        let threshold = (_.get(query_params, 'settings.EMBEDDINGS_ENABLE')) ? _.get(query_params,'settings.EMBEDDINGS_SCORE_ANSWER_THRESHOLD',0) : 1
        qnabot.log(`Score threshold for answer matches is: ${threshold}.`)
        es_response = score_threshold_check(es_response, threshold)
        gothits = _.get(es_response, 'hits.hits.length');
        matched_field = (gothits) ? "answer" : "";
    }

    // apply topic tiebreaker to any equally ranked hits, trim to desired size, and set answersource to display in debug mode.
    if (gothits) {
        const newhits = hits_topic_tiebreaker(query_params.topic, es_response.hits.hits);
        es_response.hits.hits = newhits.slice(0,size);
        _.set(es_response, "hits.hits[0]._source.answersource", `ElasticSearch (matched ${matched_field} field)`);
    }
    qnabot.log(`Response from run_query_es, after applying topic tiebreaker => ${JSON.stringify(es_response)}` )
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