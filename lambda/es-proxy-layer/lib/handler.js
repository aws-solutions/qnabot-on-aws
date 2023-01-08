var Url=require('url');
var Promise=require('bluebird');
var request=require('./request');
var _=require('lodash');
var build_es_query=require('./esbodybuilder');
var kendra = require('./kendraQuery');
const qnabot = require("qnabot/logging")
const qna_settings = require("qnabot/settings")
const open_es = require("./es_query")
const get_embeddings = require('./embeddings');

async function get_settings() {
    let settings = await qna_settings.merge_default_and_custom_settings();
    qnabot.log("Merged Settings: ", settings);
    return settings;
}

// add embeddings for each question in an add or modify item PUT query
async function build_additem_embeddings(event, settings) {
    if (settings.EMBEDDINGS_API === "DISABLED") {
        console.log("EMBEDDINGS_API (disabled) - query not modified");
        return event.body;
    }
    var params = {
        settings: settings
    }
    var questions = _.get(event,"body.questions",[]);
    var questions_with_embeddings = await Promise.all(questions.map(async x => {
        params.question = x.q;
        params.topic = _.get(event,"body.t");
        const embeddings = await get_embeddings(params);
            return {
                q: x.q,
                q_vector: embeddings
            }
    }));
    event.body.questions = questions_with_embeddings;
    return event.body;
}

/*
{
    "endpoint": "search-qnaos-d-elasti-55f9xbclw5ox-dnkbx36pzqpx6regs2sidghbnu.us-east-1.es.amazonaws.com",
    "method": "PUT",
    "path": "/qnaos-dev-dev-master-8/0.test?refresh=wait_for",
    "body": {
        "qid": "0.test",
        "quniqueterms": " new question  ",
        "questions": [
            {
                "q": "new question"
            }
        ],
        "a": "answer",
        "type": "qna"
    }
}
*/

async function get_es_query(event, settings) {
    let question = _.get(event,'question','');
    let size = _.get(event,'size',1);
    if (question.length > 0) {
        if (open_es.isQuestionAllStopwords(question)) {
            qnabot.log(`Question '${question}' contains only stop words. Forcing no hits.`);
            size = 0;
        }
        var query_params = {
            question: question,
            topic: _.get(event,'topic',''),
            from: _.get(event,'from',0),
            size: size,
            minimum_should_match: _.get(settings,'ES_MINIMUM_SHOULD_MATCH'),
            phrase_boost: _.get(settings, 'ES_PHRASE_BOOST'),
            use_keyword_filters: _.get(settings,'ES_USE_KEYWORD_FILTERS'),
            keyword_syntax_types: _.get(settings,'ES_KEYWORD_SYNTAX_TYPES'),
            syntax_confidence_limit: _.get(settings,'ES_SYNTAX_CONFIDENCE_LIMIT'),
            score_answer_field: _.get(settings,'ES_SCORE_ANSWER_FIELD'),
            fuzziness: _.get(settings, 'ES_USE_FUZZY_MATCH'),
            es_expand_contractions: _.get(settings,"ES_EXPAND_CONTRACTIONS"),
            settings: settings
        };
        return build_es_query(query_params);
    } else if (_.get(event,'method','') === 'PUT') {
        // add or modify item query - add embeddings for questions list, if enabled
        return await build_additem_embeddings(event, settings);
    } else {
        // use query as-is
        return Promise.resolve(event.body);
    }
}



async function run_query_es(event, settings) {
    var es_query = await get_es_query(event, settings);
    qnabot.log("ElasticSearch Query",JSON.stringify(es_query,null,2));
    var es_response = await request({
        url:Url.resolve("https://"+event.endpoint,event.path),
        method:event.method,
        headers:event.headers,
        body:es_query,
    });
    if (_.get(es_response, "hits.max_score") == 0) {
        qnabot.log("Max score is zero - no valid results")
        es_response.hits.hits = [] ;
    }
    return es_response;
}


async function run_query_kendra(event, kendra_index) {
    qnabot.log("Kendra FAQ Query index:" + kendra_index);
    qnabot.log(event)
    var request_params = {
        kendra_faq_index:kendra_index,
        question:event.question,
        size:10, // limit kendra hits to 10 max to avoid pagination issues
        es_address: event.endpoint,
        es_path: event.path,
        minimum_score: event.minimum_score,
    } ;
    var kendra_response = await kendra.handler(request_params);
    return kendra_response;
}

module.exports= async (event, context, callback) => {
    try {
        var settings = await get_settings();
        qna_settings.set_environment_variables(settings)
        qnabot.log('Received event:', JSON.stringify(event, null, 2));

        var kendra_index = _.get(settings, "KENDRA_FAQ_INDEX")
        event.minimum_score = _.get(settings, 'ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE', "MEDIUM")
        var question = _.get(event,'question','');
        var topic = _.get(event,'topic','');

        let req = {
           question: question,
        }
        //TODO: At some point we should expose a qnaClientFilter field in the
        //Content Designer and pass the value here.
        let params = {
            topic: topic,
            kendraIndex: kendra_index,
            question: question
        }
        let okKendraQuery = !(await open_es.isESonly(req,params))
        let response
        if ( okKendraQuery ) {
            response = await run_query_kendra(event, kendra_index);
            // ES fallback if KendraFAQ fails
            var hit = _.get(response, "hits.hits[0]._source");
            if (!hit && _.get(settings, 'KENDRA_FAQ_ES_FALLBACK', false)){
                qnabot.log("ES Fallback");
                response = await run_query_es(event, settings);
            }
        }
        else {
            response = await run_query_es(event, settings);
        }

        qnabot.log("Query response: ", JSON.stringify(response,null,2));
        return callback(null, response);
    } catch (error) {

        return callback(JSON.stringify({
            type:_.get(error,"response.status") ===404 ? "[NotFound]":"[InternalServiceError]",
            status:_.get(error,"response.status"),
            message:_.get(error,"response.statusText"),
            data:_.get(error,"response.data"),
            error: error,
        }))
    }
}
