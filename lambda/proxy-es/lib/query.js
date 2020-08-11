//start connection
var _ = require('lodash');
var safeEval = require('safe-eval');
const aws = require('aws-sdk');
var request = require('./request');
var build_es_query = require('./esbodybuilder');
var handlebars = require('./handlebars');
var translate = require('./translate');
var kendra = require('./kendraQuery');
// const sleep = require('util').promisify(setTimeout);


// use DEFAULT_SETTINGS_PARAM as random encryption key unique to this QnABot installation
var key = _.get(process.env, "DEFAULT_SETTINGS_PARAM", "fdsjhf98fd98fjh9 du98fjfd 8ud8fjdf");
var encryptor = require('simple-encryptor')(key);

async function run_query(req, query_params) {
    var no_hits_question = _.get(req, '_settings.ES_NO_HITS_QUESTION', 'no_hits');
    var kendrafaq = _.get(req, "_settings.KENDRA_FAQ_INDEX");
    // var kendra_fb = _.get(req, '_.settings.ALT_KENDRA_INDEXES', []);
    // if (kendrafaq!='' && kendra_fb!=[] && query_params['question']===no_hits_question) {    // 2-second sleep to optimize kendra query calls
    //     await sleep(2000);
    // }
    var ES_only_questions = [no_hits_question];
    
    if (kendrafaq != "" && !(ES_only_questions.includes(query_params['question']))){
        return await run_query_kendra(req, query_params);
    } else {
        return await run_query_es(req, query_params);
    }
}

async function run_query_es(req, query_params) {
    var es_query = await build_es_query(query_params);
    console.log('Querying ElasticSearch');
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


async function run_query_kendra(req, query_params) {
    console.log("Querying Kendra FAQ index: " + _.get(req, "_settings.KENDRA_FAQ_INDEX"));
    // calls kendrQuery function which duplicates KendraFallback code, but only searches through FAQs
    var request_params = {
        kendra_faq_index:req["_settings"]["KENDRA_FAQ_INDEX"],
        maxRetries:req["_settings"]["KENDRAFAQ_CONFIG_MAX_RETRIES"],
        retryDelay:req["_settings"]["KENDRAFAQ_CONFIG_RETRY_DELAY"],
    }
    // autotranslate
    if (req["_event"]['userDetectedLocale'] != 'en') {
        request_params['input_transcript'] = query_params.question;
    } else {
        request_params['input_transcript']= req["_event"].inputTranscript;
    }
    
    // optimize kendra queries for throttling by checking if KendraFallback idxs include KendraFAQIndex
    let alt_kendra_idxs = _.get(req, "_settings.ALT_SEARCH_KENDRA_INDEXES");
    if (alt_kendra_idxs && alt_kendra_idxs.length) {
        try {
            // parse JSON array of kendra indexes
            alt_kendra_idxs = JSON.parse(alt_kendra_idxs);
        } catch (err) {
            // assume setting is a string containing single index
            alt_kendra_idxs = [ alt_kendra_idxs ];
        }
    }
    if (alt_kendra_idxs.includes(request_params.kendra_faq_index)) {
        console.log(`optimizing for KendraFallback`);
        request_params['same_index'] = true
    }

    var kendra_response = await kendra.handler(request_params);
    
    if (_.get(kendra_response, "hits.hits[0]._source")) {
        _.set(kendra_response, "hits.hits[0]._source.answersource", "Kendra FAQ");
    }
    return kendra_response;

}

function merge_next(hit1, hit2) {
    if (hit1 === undefined) {
        return hit2;
    }
    console.log("Merge chained items");
    // merge plaintext answer
    if (hit1 && hit1.a) {
        hit2.a = hit1.a + hit2.a;
    }
    // merge markdown, if present in both items
    var md1 = (_.get(hit1, "alt.markdown"));
    var md2 = (_.get(hit2, "alt.markdown"));
    if (md1 && md2) {
        _.set(hit2, "alt.markdown", md1 + "\n" + md2);
    } else {
        console.log("Markdown field missing from one or both items; skip markdown merge");
    }
    // merge SSML, if present in both items
    var ssml1 = (_.get(hit1, "alt.ssml"));
    var ssml2 = (_.get(hit2, "alt.ssml"));
    if (ssml1 && ssml2) {
        // strip <speak> tags
        ssml1 = ssml1.replace(/<speak>|<\/speak>/g, "");
        ssml2 = ssml2.replace(/<speak>|<\/speak>/g, "");
        // concatenate, and re-wrap with <speak> tags
        _.set(hit2, "alt.ssml", "<speak>" + ssml1 + " " + ssml2 + "</speak>");
    } else {
        console.log("SSML field missing from one or both items; skip SSML merge");
    }
    // all other fields inherited from item 2
    console.log("Chained items merged:", hit2);
    return hit2;
}

async function get_hit(req, res) {
    var query_params = {
        question: req.question,
        topic: _.get(req, 'session.topic', ''),
        from: 0,
        size: 1,
        minimum_should_match: _.get(req, '_settings.ES_MINIMUM_SHOULD_MATCH'),
        phrase_boost: _.get(req, '_settings.ES_PHRASE_BOOST'),
        use_keyword_filters: _.get(req, '_settings.ES_USE_KEYWORD_FILTERS'),
        keyword_syntax_types: _.get(req, '_settings.ES_KEYWORD_SYNTAX_TYPES'),
        syntax_confidence_limit: _.get(req, '_settings.ES_SYNTAX_CONFIDENCE_LIMIT'),
        score_answer_field: _.get(req, '_settings.ES_SCORE_ANSWER_FIELD'),
        fuzziness: _.get(req, '_settings.ES_USE_FUZZY_MATCH'),
    };
    var no_hits_question = _.get(req, '_settings.ES_NO_HITS_QUESTION', 'no_hits');
    var response = await run_query(req, query_params);
    console.log("Query response: ", JSON.stringify(response,null,2));
    var hit = _.get(response, "hits.hits[0]._source");
    
    // TODO: check during merge
    console.log(`response.kendraResultsCached after first hit: ${JSON.stringify(response.kendraResultsCached)}`);
    _.set(req, "kendraResultsCached", response.kendraResultsCached);
    
    // ES fallback if KendraFAQ fails
    console.log('ES Fallback');
    if (!hit && _.get(req, '_settings.ES_FALLBACK', false)) {
        response = await run_query_es(req, query_params);
        if (_.get(response, "hits.hits[0]._source")) {
            _.set(response, "hits.hits[0]._source.answersource", "ES Fallback");
        }
        hit = _.get(response, "hits.hits[0]._source");
    }
    
    if (hit) {
        res['got_hits'] = 1;  // response flag, used in logging / kibana
    } else {
        console.log("No hits from query - searching instead for: " + no_hits_question);
        query_params['question'] = no_hits_question;
        res['got_hits'] = 0;  // response flag, used in logging / kibana
        
        response = await run_query(req, query_params);
        hit = _.get(response, "hits.hits[0]._source");
    }
    // Do we have a hit?
    if (hit) {
        // set res topic from document before running handlebars, so that handlebars can access or overwrite it.
        _.set(res, "session.topic", _.get(hit, "t"));
        // run handlebars template processing
        hit = await handlebars(req, res, hit);
        // encrypt conditionalChaining rule, if set
        const conditionalChaining = _.get(hit, "conditionalChaining");
        if (conditionalChaining) {
            console.log("Encrypt conditionalChaining rule to ensure it is tamper proof in session attributes");
            const encrypted = encryptor.encrypt(conditionalChaining);
            _.set(hit, "conditionalChaining", encrypted);
        }
    }
    return hit;
}

/**
 * Central location to evaluate conditional chaining. Chaining can take place either when an elicitResponse is
 * complete or during the normal course of question processing. A question can be chained even if it is not
 * involved in an elicitResponse.
 * @param req
 * @param res
 * @param hit - the original hit found through a query. note this may be a "fakeHit" in the case of elicitResponse processing.
 * @param conditionalChaining
 * @returns {Promise<*>}
 */
async function evaluateConditionalChaining(req, res, hit, conditionalChaining) {
    console.log("evaluateConditionalChaining req: ", JSON.stringify(req, null, 2));
    console.log("evaluateConditionalChaining res: ", JSON.stringify(res, null, 2));
    console.log("evaluateConditionalChaining hit: ", JSON.stringify(hit, null, 2));
    // decrypt conditionalChaining
    conditionalChaining = encryptor.decrypt(conditionalChaining);
    console.log("Decrypted Chained document rule specified:", conditionalChaining);
    var next_q;
    // If chaining rule a lambda, or an expression?
    if (conditionalChaining.toLowerCase().startsWith("lambda::")) {
        // Chaining rule is a Lambda function
        var lambdaName = conditionalChaining.split("::")[1] ;
        console.log("Calling Lambda:", lambdaName);
        var lambda= new aws.Lambda();
        var lambdares=await lambda.invoke({
            FunctionName:lambdaName,
            InvocationType:"RequestResponse",
            Payload:JSON.stringify({
                req:req,
                res:res
            })
        }).promise();
        next_q=lambdares.Payload;
    } else {
        // create chaining rule safeEval context, aligned with Handlebars context
        const SessionAttributes = (arg) => _.get(SessionAttributes, arg, undefined);
        _.assign(SessionAttributes, res.session);
        const context={
            LexOrAlexa: req._type,
            UserInfo:req._userInfo, 
            SessionAttributes,
            Settings: req._settings,
            Question: req.question,
            OrigQuestion: _.get(req,"_event.origQuestion",req.question),
            Sentiment: req.sentiment,
        };
        console.log("Evaluating:", conditionalChaining);
        // safely evaluate conditionalChaining expression.. throws an exception if there is a syntax error
        next_q = safeEval(conditionalChaining, context);
    }
    console.log("Chained document rule evaluated to:", next_q);
    req.question = next_q;
    const hit2 = await get_hit(req, res);
    // if the question we are chaining to, also has conditional chaining, be sure to navigate set up
    // next user input to elicitResponse from this lex Bot.
    if (hit2) {
        const responsebot_hook = _.get(hit2, "elicitResponse.responsebot_hook", undefined);
        const responsebot_session_namespace = _.get(hit2, "elicitResponse.response_sessionattr_namespace", undefined);
        const chaining_configuration = _.get(hit2, "conditionalChaining", undefined);
        var elicitResponse = {} ;
        if (responsebot_hook && responsebot_session_namespace) {
            elicitResponse.responsebot = responsebot_hook;
            elicitResponse.namespace = responsebot_session_namespace;
            elicitResponse.chainingConfig = chaining_configuration;
            _.set(res.session, res.session.elicitResponseNamespace + ".boterror", undefined );
        } else {
            elicitResponse.responsebot = undefined;
            elicitResponse.namespace = undefined;
            elicitResponse.chainingConfig = chaining_configuration;
        }
        _.set(res.session,'qnabotcontext.elicitResponse',elicitResponse);
        return (merge_next(hit, hit2));
    } else {
        console.log("WARNING: No documents found for evaluated chaining rule:", next_q);
        return hit;
    }
}

module.exports = async function (req, res) {
    let redactEnabled = _.get(req, '_settings.ENABLE_REDACTING');
    let redactRegex = _.get(req, '_settings.REDACTING_REGEX', "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b");

    if (redactEnabled) {
        process.env.QNAREDACT= "true";
        process.env.REDACTING_REGEX = redactRegex;
    } else {
        process.env.QNAREDACT="false";
        process.env.REDACTING_REGEX="";
    }
    const elicitResponseChainingConfig = _.get(res, "session.qnabotcontext.elicitResponse.chainingConfig", undefined);
    const elicitResponseProgress = _.get(res, "session.qnabotcontext.elicitResponse.progress", undefined);
    let hit = undefined;
    if (elicitResponseChainingConfig && (elicitResponseProgress === 'Fulfilled') || elicitResponseProgress === 'ReadyForFulfillment') {
        // elicitResponse is finishing up as the LexBot has fulfilled its intent.
        // we use a fakeHit with either the Bot's message or an empty string.
        let fakeHit = {};
        fakeHit.a = res.message ? res.message : "";
        hit = await evaluateConditionalChaining(req, res, fakeHit, elicitResponseChainingConfig);
    } else {
        // elicitResponse is not involved. obtain the next question to serve up to the user.
        hit = await get_hit(req, res);
        
    }
    
    if (hit) {
        // found a document in elastic search.
        if (_.get(hit, "conditionalChaining") && _.get(hit, "elicitResponse.responsebot_hook", "") === "" ) {
            // ElicitResonse is not involved and this document has conditionalChaining defined. Process the
            // conditionalChaining in this case.
            hit = await evaluateConditionalChaining(req, res, hit, hit.conditionalChaining);
        }
        // translate response
        var usrLang = 'en';
        if (_.get(req._settings, 'ENABLE_MULTI_LANGUAGE_SUPPORT')) {
            usrLang = _.get(req, 'session.userLocale');
            if (usrLang != 'en') {
                console.log("Autotranslate hit to usrLang: ", usrLang);
                hit = await translate.translate_hit(hit, usrLang);
            } else {
                console.log("User Lang is en, Autotranslate not required.");
            }
        }
        // prepend debug msg
        if (_.get(req._settings, 'ENABLE_DEBUG_RESPONSES')) {
            var msg = "User Input: \"" + req.question + "\"";
            if (usrLang != 'en') {
                msg = "User Input: \"" + _.get(req,"_event.origQuestion","notdefined") + "\", Translated to: \"" + req.question + "\"";
            }
            msg += ", Source: " + _.get(hit, "answersource", "unknown");
            var debug_msg = {
                a: "[" + msg + "] ",
                alt: {
                    markdown: "*[" + msg + "]*  \n",
                    ssml: "<speak>" + msg + "</speak>"
                }
            };
            hit = merge_next(debug_msg, hit);
        };
        res.result = hit;
        res.type = "PlainText"
        res.message = res.result.a
        res.plainMessage = res.result.a
        
        // Add answerSource for query hits
        var ansSource = _.get(hit, "answersource", "unknown")
        if (ansSource==="Kendra FAQ") {
            res.answerSource = "KENDRA"
        } else if (ansSource==="ElasticSearch" || ansSource==="ES Fallback") {
            res.answerSource = "ES"
        } else {
            res.answerSource = ansSource
        }

        // Add alt messages to appContext session attribute JSON value (for lex-web-ui)
        var tmp
        try {
            tmp=JSON.parse(_.get(res,"session.appContext","{}"));
        } catch(e) {
            tmp=_.get(res,"session.appContext","{}");
        }
        tmp.altMessages=_.get(res, "result.alt", {});
        _.set(res, "session.appContext",tmp)

        if (req._preferredResponseType == "SSML") {
            if (_.get(res, "result.alt.ssml")) {
                res.type = "SSML"
                res.message = res.result.alt.ssml.replace(/\r?\n|\r/g, ' ')
            }
        }
        console.log(res.message)
        var card = _.get(res, "result.r.title") ? res.result.r : null

        if (card) {
            res.card.send = true
            res.card.title = _.get(card, 'title')
            res.card.subTitle = _.get(card, 'subTitle')
            res.card.imageUrl = _.get(card, 'imageUrl')
            res.card.buttons = _.get(card, 'buttons')
        }


        var navigationJson = _.get(res, "session.navigation", false)
        var previousQid = _.get(res, "session.previous.qid", false)
        var previousArray = _.get(res, "session.navigation.previous", [])

        if (
            previousQid != _.get(res.result, "qid") &&
            _.get(navigationJson, "hasParent", true) == false &&
            req._info.es.type == 'qna') {
            if (previousArray.length == 0) {
                previousArray.push(previousQid)
            } else if (previousArray[previousArray.length - 1] != previousQid) {
                previousArray.push(previousQid)
            }

        }
        if (previousArray.length > 10) {
            previousArray.shift()
        }
        var hasParent = true
        if ("next" in res.result) {
            hasParent = false
        }
        res.session.previous = {
            qid: _.get(res.result, "qid"),
            a: _.get(res.result, "a"),
            alt: _.get(res.result, "alt", {}),
            q: req.question
        }
        res.session.navigation = {
            next: _.get(res.result,
                "next",
                _.get(res, "session.navigation.next", "")
            ),
            previous: previousArray,
            hasParent: hasParent
        }
    } else {
        res.type = "PlainText"
        res.message = _.get(req, '_settings.EMPTYMESSAGE', 'You stumped me!');
    }
    // add session attributes for qid and no_hits - useful for Amazon Connect integration
    res.session.qnabot_qid = _.get(res.result, "qid", "") ;
    res.session.qnabot_gotanswer = (res['got_hits'] > 0) ? true : false ;

    console.log("RESULT", JSON.stringify(req), JSON.stringify(res))
};
