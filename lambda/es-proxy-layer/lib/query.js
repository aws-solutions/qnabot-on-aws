//start connection
var _ = require('lodash');
const aws = require('aws-sdk');
var handlebars = require('./handlebars');
var translate = require('./translate');
var kendra = require('./kendraQuery');
var kendra_fallback = require('./kendra');
const qnabot = require('qnabot/logging');
const qna_settings = require('qnabot/settings');
const open_es = require('./es_query');
const llm = require('./llm');
const {VM} = require('vm2');


// use DEFAULT_SETTINGS_PARAM as random encryption key unique to this QnABot installation
var key = _.get(process.env, 'DEFAULT_SETTINGS_PARAM', 'fdsjhf98fd98fjh9 du98fjfd 8ud8fjdf');
var encryptor = require('simple-encryptor')(key);

async function run_query(req, query_params) {
    query_params.kendraIndex = _.get(req, '_settings.KENDRA_FAQ_INDEX')
    var onlyES = await open_es.isESonly(req, query_params);
    let response = '';
    // runs kendra query if question supported on Kendra and KENDRA_FAQ_INDEX is set
    if (!onlyES){
        response= await run_query_kendra(req, query_params);
    }
    else {
        response= await open_es.run_query_es(req, query_params);
    }
    return response;
}

async function run_query_kendra(req, query_params) {
    qnabot.log('Querying Kendra FAQ index: ' + _.get(req, '_settings.KENDRA_FAQ_INDEX'));
    // calls kendraQuery function which duplicates KendraFallback code, but only searches through FAQs
    var request_params = {
        kendra_faq_index:_.get(req, '_settings.KENDRA_FAQ_INDEX'),
        maxRetries:_.get(req, '_settings.KENDRA_FAQ_CONFIG_MAX_RETRIES'),
        retryDelay:_.get(req, '_settings.KENDRA_FAQ_CONFIG_RETRY_DELAY'),
        minimum_score: _.get(req, '_settings.ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE'),
        size:1,
        question: query_params.question,
        es_address: req._info.es.address,
        es_path: '/' + req._info.es.index + '/_search?search_type=dfs_query_then_fetch',
    } ;

    // optimize kendra queries for throttling by checking if KendraFallback idxs include KendraFAQIndex
    let alt_kendra_idxs = _.get(req, '_settings.ALT_SEARCH_KENDRA_INDEXES');
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
        qnabot.debug('optimizing for KendraFallback');
        request_params['same_index'] = true ;
    }

    var kendra_response = await kendra.handler(request_params);
    if (_.get(kendra_response, 'hits.hits[0]._source')) {
        _.set(kendra_response, 'hits.hits[0]._source.answersource', 'Kendra FAQ');
    }
    return kendra_response;
}

// resolves Lambda function name for bundled example lambdas refernced in env.
function getLambdaName(lambdaRef){
    var match=lambdaRef.match(/QNA:(.*)/);
    if(match){
        return process.env[match[1]] || lambdaRef;
    }else{
        return lambdaRef;
    }
}

// used to invoke either chaining rule lambda, or Lambda hook
async function invokeLambda (lambdaRef, req, res) {
    let lambdaName = getLambdaName(lambdaRef);
    qnabot.log('Calling Lambda:', lambdaName);
    var event={req:req, res:res};
    var lambda= new aws.Lambda();
    var lambdares=await lambda.invoke({
        FunctionName:lambdaName,
        InvocationType:'RequestResponse',
        Payload:JSON.stringify(event)
    }).promise();
    var payload=lambdares.Payload;
    try {
        payload = JSON.parse(payload);
        if (_.get(payload,'req') && _.get(payload,'res')) {
            req = _.get(payload,'req') ;
            res = _.get(payload,'res') ;
        }
    } catch (e) {
        // response is not JSON - noop
    }
    qnabot.log('Lambda returned payload: ',payload);
    return [req, res, payload];
}

function merge_next(hit1, hit2) {
    if (hit1 === undefined) {
        return hit2;
    }
    qnabot.debug('Merge chained items');
    // merge plaintext answer
    if (hit1 && hit1.a) {
        hit2.a = hit1.a + hit2.a;
    }
    // merge markdown, if present in both items
    var md1 = _.get(hit1, 'alt.markdown');
    var md2 = _.get(hit2, 'alt.markdown');
    if (md1 && md2) {
        _.set(hit2, 'alt.markdown', md1 + '\n' + md2);
    } else {
        qnabot.debug('Markdown field missing from one or both items; skip markdown merge');
    }
    // merge SSML, if present in both items
    var ssml1 = _.get(hit1, 'alt.ssml');
    var ssml2 = _.get(hit2, 'alt.ssml');
    if (ssml1 && ssml2) {
        // strip <speak> tags
        ssml1 = ssml1.replace(/<speak>|<\/speak>/g, '');
        ssml2 = ssml2.replace(/<speak>|<\/speak>/g, '');
        // concatenate, and re-wrap with <speak> tags
        _.set(hit2, 'alt.ssml', '<speak>' + ssml1 + ' ' + ssml2 + '</speak>');
    } else {
        qnabot.debug('SSML field missing from one or both items; skip SSML merge');
    }
    // build arrays of Lambda Hooks and arguments
    var lambdahooks = _.get(hit1, 'lambdahooks',[]);
    // if hits1 doesn't have a lambdahooks field (no previous merge), then initialize using 'l' and 'args' from hit 1
    if ( lambdahooks.length == 0 ) {
        lambdahooks = [
            {
                l:      _.get(hit1, 'l'),
                args:   _.get(hit1, 'args',[]),
            }
        ];
    }
    lambdahooks.push({
        l:      _.get(hit2, 'l'),
        args:   _.get(hit2, 'args',[]),
    });
    _.set(hit2, 'lambdahooks', lambdahooks);

    // all other fields inherited from item 2
    qnabot.debug('Items merged:', hit2);
    return hit2;
}

function prepend_llm_qa_answer(prefix, qa_answer, hit) {
    // prepend sm answer to plaintext and markdown
    prefix = prefix.trim();
    hit.a = `${prefix} \n\n${qa_answer} \n\n${hit.a}`;
    hit.alt.markdown = `**${prefix}**\n\n${qa_answer}\n\n${hit.alt.markdown}`;
    // replace ssml with just the short answer for concise voice responses
    hit.alt.ssml = qa_answer;
    qnabot.log("modified hit:", JSON.stringify(hit));
    return hit;
}

function get_sourceLinks_from_passages(inputText) {
    const sourceLinkPattern = /^\s*Source Link:(.*)$/gm;
    let matches, sourceLinks = [];
    
    while ((matches = sourceLinkPattern.exec(inputText)) !== null) {
        sourceLinks.push(matches[1].trim().replace(/^"|"$/g, ''));
    }
    const uniqueLinks = [...new Set(sourceLinks)];
    return `Sources: ${uniqueLinks.join(', ')}`;
    }

async function run_llm_qa(req, hit) {

    if ( ! req._settings.LLM_QA_ENABLE ) {
        // nothing to do
        return hit;
    }

    // LLM_QA_ENABLE is TRUE
    const debug = req._settings.ENABLE_DEBUG_RESPONSES;
    const context = hit.a;
    if (req._settings.LLM_QA_SHOW_CONTEXT_TEXT == false) {
        // remove context text.. hit will contain only the QA Summary output
        hit.a = "";
        hit.alt.markdown = "";
        hit.alt.ssml = "";
    } else {
        // Context provided only in markdown channel (excluded from chat memory) 
        hit.a = "";
        const ctx = llm.clean_context(hit.alt.markdown, req);
        hit.alt.markdown = `**Context**\n\n${ctx}\n`;
        hit.alt.ssml = "";     
    }

    if (hit.refMarkdown) {
        hit.alt.markdown = `${hit.alt.markdown}\n${hit.refMarkdown}`;
    }

    const start = Date.now();
    const answer = await llm.get_qa(req, context);
    const end = Date.now();
    const timing = (debug) ? `(${end - start} ms)` : ''; 
    // check for 'don't know' response from LLM and convert to no_hits behavior if pattern matches
    const no_hits_regex = req._settings.LLM_QA_NO_HITS_REGEX || `Sorry, I don't know`;
    const no_hits_res = answer.search(new RegExp(no_hits_regex, 'g'));
    if (no_hits_res < 0) {
        const llm_qa_prefix = `${req._settings.LLM_QA_PREFIX_MESSAGE} ${timing}` ;
        hit = prepend_llm_qa_answer(llm_qa_prefix, answer, hit);
        hit.debug.push("LLM: ", req._settings.LLM_API);
    } else {
        qnabot.log(`No Hits pattern returned by LLM: "${no_hits_regex}"`);
        hit = undefined;
    }

    return hit;
}

async function get_hit(req, res) {
    let question = req.question;
    let qid = _.get(req, 'qid');
    if (qid) {
        question = `QID::${qid}`;
        qnabot.log(`*** QID identified in request: ${qid}`)
    }
    let size = 1;
    var no_hits_question = _.get(req, '_settings.ES_NO_HITS_QUESTION', 'no_hits');
    if (open_es.isQuestionAllStopwords(question)) {
        qnabot.log(`Question '${question}' contains only stop words. Forcing no hits.`);
        size = 0;
    }
    var query_params = {
        question: question,
        topic: _.get(req, 'session.topic', ''),
        from: 0,
        size: size,
        minimum_should_match: _.get(req, '_settings.ES_MINIMUM_SHOULD_MATCH'),
        phrase_boost: _.get(req, '_settings.ES_PHRASE_BOOST'),
        use_keyword_filters: _.get(req, '_settings.ES_USE_KEYWORD_FILTERS'),
        keyword_syntax_types: _.get(req, '_settings.ES_KEYWORD_SYNTAX_TYPES'),
        syntax_confidence_limit: _.get(req, '_settings.ES_SYNTAX_CONFIDENCE_LIMIT'),
        fuzziness: _.get(req, '_settings.ES_USE_FUZZY_MATCH'),
        es_expand_contractions: _.get(req,'_settings.ES_EXPAND_CONTRACTIONS'),
        kendra_indexes: _.get(req,'_settings.ALT_SEARCH_KENDRA_INDEXES'),
        minimum_confidence_score: _.get(req,'_settings.ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE'),
        qnaClientFilter: _.get(req, 'session.QNAClientFilter'),
        settings: req._settings,
    };
    var response = await run_query(req, query_params);
    qnabot.log('Query response: ', JSON.stringify(response,null,2));
    var hit = _.get(response, 'hits.hits[0]._source');

    _.set(res, 'kendraResultsCached', response.kendraResultsCached);
    if (response.kendraResultsCached) qnabot.debug('kendra results cached in res structure');
    _.set(req, 'session.qnabotcontext.kendra', response.kendra_context);
    if (response.kendra_context) qnabot.log('kendra context set in res session');

    // ES fallback if KendraFAQ fails
    if (!hit && _.get(req, '_settings.KENDRA_FAQ_INDEX') && _.get(req, '_settings.KENDRA_FAQ_ES_FALLBACK', true)) {
        qnabot.log('ElasticSearch Fallback');
        response = await open_es.run_query_es(req, query_params);
        if (_.get(response, 'hits.hits[0]._source')) {
            _.set(response, 'hits.hits[0]._source.answersource', 'ElasticSearch Fallback');
        }
        hit = _.get(response, 'hits.hits[0]._source');
    }

    if (hit) {
        // Check if item contains redirects to a targeted Kendra query
        if (_.get(hit, 'kendraRedirectQueryText')) {
            let redirect = {
                'kendraRedirectQueryText' : _.get(hit, 'kendraRedirectQueryText'),
                'kendraRedirectQueryArgs' : _.get(hit, 'kendraRedirectQueryArgs', []),
            }
            // process any handlebars before running Kendra redirect query
            qnabot.log('Kendra redirect query: Process with handlebars before redirecting.' );
            redirect = await handlebars(req, res, redirect);
            const kendraRedirectQueryText = _.get(redirect, 'kendraRedirectQueryText');
            const kendraRedirectQueryArgs = _.get(redirect, 'kendraRedirectQueryArgs', []);
            const kendraRedirectQueryConfidenceThreshold = _.get(
                hit, 'kendraRedirectQueryConfidenceThreshold',
                _.get(req,'_settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE')
            );
            qnabot.log(`Kendra redirect query: '${kendraRedirectQueryText}' - Args = '${kendraRedirectQueryArgs}'` );
            qnabot.log(`Kendra redirect query confidence threshold: '${kendraRedirectQueryConfidenceThreshold}'` );
            req.question = kendraRedirectQueryText;
            req.kendraQueryArgs = kendraRedirectQueryArgs;
            req._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = kendraRedirectQueryConfidenceThreshold;
            // remove any cached results from FAQ query
            delete res.kendraResultsCached;
            let redirect_hit = await  kendra_fallback.handler({req,res})
            if (redirect_hit) {
                qnabot.log('Result from Kendra Redirect query: ' + JSON.stringify(redirect_hit));
                hit.answersource = 'KENDRA REDIRECT' ;
                hit.a = _.get(redirect_hit, 'a');
                hit.alt = _.get(redirect_hit, 'alt');
            } else {
                qnabot.log('Kendra Redirect query returned no hits. Disable Kendra fallback query.');
                query_params.kendra_indexes = '';
                hit = null;
            }
        }
    }

    if (hit) {
        res['got_hits'] = 1;  // response flag, used in logging / kibana
        if (! hit.debug) {
            hit.debug=[];
        }
        if (hit.passage && !hit.a) {
            // Set the answer (a) field to match the text item passage field.
            hit.a = hit.passage; 
        }
        if (! _.get(hit, "alt.markdown")) {
            _.set(hit, "alt.markdown", hit.a);
        }
        if (! _.get(hit, "alt.ssml")) {
            _.set(hit, "alt.ssml", hit.a);
        }
        if (hit.type === 'text') {
            // Run any configured QA Summary options on the text passage result
            hit = await run_llm_qa(req, hit);
        }
    } else if(query_params.kendra_indexes.length != 0) {
        qnabot.log('Query Kendra Fallback ' + JSON.stringify(req));
        hit = await kendra_fallback.handler({req,res});
        qnabot.log('Result from Kendra Fallback ' + JSON.stringify(hit));
        if(hit &&  hit.hit_count != 0)
        {
            hit.refMarkdown = get_sourceLinks_from_passages(hit.alt.markdown);
            // Run any configured QA Summary LLM model options on Kendra results
            hit = await run_llm_qa(req, hit);
            if (hit) {
                _.set(res,'answersource','Kendra Fallback');
                _.set(res,'session.qnabot_gotanswer',true) ;
                _.set(res,'message', hit.a);
                _.set(req,'debug',hit.debug)
                res['got_hits'] = 1;
            }
        }
    }
    if(!hit)
    {
        qnabot.log('No hits from query - searching instead for: ' + no_hits_question);
        query_params['question'] = no_hits_question;
        query_params['score_text_passage'] = false;
        query_params['size'] = 1;
        res['got_hits'] = 0;  // response flag, used in logging / kibana
        response = await run_query(req, query_params);
        hit = _.get(response, 'hits.hits[0]._source');
        qnabot.log('No hits response: ' + JSON.stringify(hit))
    }
    // Do we have a hit?
    if (hit) {
        qnabot.log('Setting topic for ' + JSON.stringify(hit))
        // set res topic from document before running handlebars, so that handlebars can access or overwrite it.
        _.set(res, 'session.topic', _.get(hit, 't'));

        if(_.get(hit, 't')){
            if(!res._userInfo){
                res._userInfo = {}
            }
            if(!res._userInfo.recentTopics){
                res._userInfo.recentTopics = []
            }
            res._userInfo.recentTopics.push({
                topic: _.get(hit, 't'),
                dateTime: (new Date()).toISOString()
            })
        }
        // run handlebars template processing
        hit = await handlebars(req, res, hit);

        // encrypt conditionalChaining rule, if set
        const conditionalChaining = _.get(hit, 'conditionalChaining');
        if (conditionalChaining) {
            qnabot.log('Encrypt conditionalChaining rule to ensure it is tamper proof in session attributes');
            const encrypted = encryptor.encrypt(conditionalChaining);
            _.set(hit, 'conditionalChaining', encrypted);
        }

        // update the res object with the hit results
        res = update_res_with_hit(req, res, hit);

        // Call Lambda Hook with args now & override running as middleware step (old behavior)
        // This results in:
        //  - improved predictability of document chaining behavior.. each doc's lambda is run as it is chained
        //  - autotranslation is now applied to lambda hook responses by default when response is assembled
        // optional setting to turn off this behaviour if it causes problems, and revert to old way
        if (_.get(req, '_settings.RUN_LAMBDAHOOK_FROM_QUERY_STEP', true)) {// && res['got_hits'] == 1) { //
            var lambdaHook = _.get(hit, 'l');
            if (lambdaHook) {
                var payload;
                qnabot.log('Invoking Lambda Hook function: ', lambdaHook);
                [req, res, payload] = await invokeLambda(lambdaHook, req, res);
                // update hit with values returned in res by lambda hook
                _.set(hit, 'a', _.get(res,'message',''));
                var markdown = _.get(res,'session.appContext.altMessages.markdown','');
                var ssml = _.get(res,'session.appContext.altMessages.ssml','');
                var card = _.get(res,'card',{})
                _.set(hit, 'alt.markdown', markdown);
                _.set(hit, 'alt.ssml', ssml);
                _.set(hit,'r',card)

            }
            _.set(hit,'l','') ;
            _.set(hit,'args',[]) ;
        }
    }
    return [req, res, hit];
}

function isQidQuery(req) {
    if (req.question.toLowerCase().startsWith("qid::")) {
        return true;
    }
    if (_.get(req, 'qid')) {
        return true;
    }
    return false;
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
    qnabot.log('evaluateConditionalChaining req: ', JSON.stringify(req, null, 2));
    qnabot.log('evaluateConditionalChaining res: ', JSON.stringify(res, null, 2));
    qnabot.log('evaluateConditionalChaining hit: ', JSON.stringify(hit, null, 2));
    // decrypt conditionalChaining
    conditionalChaining = encryptor.decrypt(conditionalChaining);
    qnabot.log('Decrypted Chained document rule specified:', conditionalChaining);
    var next_q;
    // If chaining rule a lambda, or an expression?
    if (conditionalChaining.toLowerCase().startsWith('lambda::')) {
        // Chaining rule is a Lambda function
        var lambdaName = conditionalChaining.split('::')[1] ;
        var payload;
        [req, res, payload] = await invokeLambda (lambdaName, req, res);
        qnabot.log('Chaining Rule Lambda response payload: ', payload);
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            // response is not JSON
        }
        if (_.get(payload,'req') && _.get(payload,'res')) {
            next_q = _.get(payload,'req.question');
        }
        else {
            qnabot.log('Chaining Rules Lambda did not return session event in response.');
            qnabot.log('assume response is a simple string containing next_q value');
            next_q = payload ;
        }
    } else {
        // create chaining rule safeEval context, aligned with Handlebars context
        const SessionAttributes = (arg) => _.get(SessionAttributes, arg, undefined);
        _.assign(SessionAttributes, res.session);
        const Slots = (arg) => _.get(Slots, arg, undefined);
        _.assign(Slots, req.slots);
        const sandbox={
            LexOrAlexa: req._type,
            UserInfo:req._userInfo,
            SessionAttributes,
            Slots,
            Settings: req._settings,
            Question: req.question,
            OrigQuestion: _.get(req,'_event.origQuestion',req.question),
            PreviousQuestion: _.get(req, 'session.qnabotcontext.previous.q', false),
            Sentiment: req.sentiment,
        };
        qnabot.log('Evaluating:', conditionalChaining);
        // safely evaluate conditionalChaining expression.. throws an exception if there is a syntax error
        const vm = new VM({sandbox});
        next_q = vm.run(conditionalChaining, sandbox);
    }
    qnabot.log('Chained document rule evaluated to:', next_q);
    req.question = next_q;
    var hit2;
    [req, res, hit2] = await get_hit(req, res);
    // if the question we are chaining to, also has conditional chaining, be sure to navigate set up
    // next user input to elicitResponse from this lex Bot.
    if (hit2) {
        const responsebot_hook = _.get(hit2, 'elicitResponse.responsebot_hook', undefined);
        const responsebot_session_namespace = _.get(hit2, 'elicitResponse.response_sessionattr_namespace', undefined);
        const chaining_configuration = _.get(hit2, 'conditionalChaining', undefined);
        var elicitResponse = {} ;
        if (responsebot_hook && responsebot_session_namespace) {
            elicitResponse.responsebot = responsebot_hook;
            elicitResponse.namespace = responsebot_session_namespace;
            elicitResponse.chainingConfig = chaining_configuration;
            _.set(res.session, res.session.elicitResponseNamespace + '.boterror', undefined );
        } else {
            elicitResponse.responsebot = undefined;
            elicitResponse.namespace = undefined;
            elicitResponse.chainingConfig = chaining_configuration;
        }
        _.set(res.session,'qnabotcontext.elicitResponse',elicitResponse);
        var mergedhit = merge_next(hit, hit2);
        return [req, res, mergedhit] ;
    } else {
        qnabot.log('WARNING: No documents found for evaluated chaining rule:', next_q);
        return [req, res, hit];
    }
}

function update_res_with_hit(req, res, hit) {
    res.result = hit;
    res.type = 'PlainText';
    res.message = res.result.a;
    res.plainMessage = res.result.a;

    // add question defined session attributes to res with the exception of qnabotcontext and appContext
    if (_.get(hit, 'sa')){
        hit.sa.map(obj=>{
            _.set(res, `session.${obj.text}`, obj.value);
        })
    }

    // Add tags to the res object
    const tags = _.get(hit, 'tags');
    if (tags){
        _.set(res, 'tags', tags);
    }

    // Add answerSource for query hits
    var ansSource = _.get(hit, 'answersource', 'unknown');
    if (ansSource==='Kendra FAQ') { // kendra fallback sets answerSource directly
        res.answerSource = 'KENDRA FAQ';
    } else if (ansSource==='ElasticSearch' || ansSource==='ElasticSearch Fallback') {
        res.answerSource = 'ELASTICSEARCH';
    } else {
        res.answerSource = ansSource;
    }

    // Add alt messages to appContext session attribute JSON value (for lex-web-ui)
    var tmp;
    try {
        tmp=JSON.parse(_.get(res,'session.appContext','{}'));
    } catch(e) {
        tmp=_.get(res,'session.appContext','{}');
    }
    tmp.altMessages=_.get(res, 'result.alt', {});
    _.set(res, 'session.appContext',tmp);

    // Add reprompt
    var rp = _.get(res, 'result.rp');
    if (rp) {
        var type = 'PlainText';

        if (rp.includes('<speak>')) {
            type = 'SSML';
            rp = rp.replace(/\r?\n|\r/g, ' ');
        }
        _.set(res, 'reprompt',{type, text : rp });
    }

    if (req._preferredResponseType == 'SSML') {
        if (_.get(res, 'result.alt.ssml')) {
            res.type = 'SSML';
            res.message = res.result.alt.ssml.replace(/\r?\n|\r/g, ' ');
        }
    }
    qnabot.log(res.message);
    var card = _.get(res, 'result.r.title') ? res.result.r : null;

    if (card) {
        if (res.card === undefined) {
            res.card = {};
        }
        res.card.send = true;
        res.card.title = _.get(card, 'title');
        res.card.subTitle = _.get(card, 'subTitle');
        res.card.imageUrl = _.get(card, 'imageUrl');
        res.card.buttons = _.get(card, 'buttons');
    }

    var previousQid = _.get(res, 'session.qnabotcontext.previous.qid', false);
    var navigationJson = _.get(res, 'session.qnabotcontext.navigation', false);
    var previousArray = _.get(res, 'session.qnabotcontext.navigation.previous', []);
    if (
        previousQid != _.get(res.result, 'qid') &&
        _.get(navigationJson, 'hasParent', true) == false &&
        req._info.es.type == 'qna') {
        if (previousArray.length == 0) {
            previousArray.push(previousQid);
        } else if (previousArray[previousArray.length - 1] != previousQid) {
            previousArray.push(previousQid);
        }
    }
    if (previousArray.length > 10) {
        previousArray.shift();
    }
    var hasParent = true;
    if ('next' in res.result) {
        hasParent = false;
    }
    _.set(res,'session.qnabotcontext.previous', {
        qid: _.get(res.result, 'qid'),
        q: req.question
    }) ;
    _.set(res,'session.qnabotcontext.navigation', {
        next: _.get(res.result, 'next', _.get(res, 'session.qnabotcontext.navigation.next', '')),
        previous: previousArray,
        hasParent: hasParent
    }) ;
    res.session.qnabot_qid = _.get(res.result, 'qid', '') ;
    res.session.qnabot_gotanswer = (res['got_hits'] > 0) ? true : false ;
    return res;
}

async function processFulfillmentEvent(req,res) {
    qnabot.log('Process Fulfillment Code Hook event');
    // reset chatMemoryHistory if this is a new session...
    if (_.get(res,'session.qnabotcontext.previous') == undefined) {
        qnabot.log("New chat session - qnabotcontext is empty. Reset previous chatMemoryHistory"); 
        req._userInfo.chatMessageHistory = "[]";
    }
    const elicitResponseChainingConfig = _.get(res, 'session.qnabotcontext.elicitResponse.chainingConfig', undefined);
    const elicitResponseProgress = _.get(res, 'session.qnabotcontext.elicitResponse.progress', undefined);
    let hit = undefined;
    if (elicitResponseChainingConfig && (elicitResponseProgress === 'Fulfilled' || elicitResponseProgress === 'ReadyForFulfillment' || elicitResponseProgress === 'Close' || elicitResponseProgress === 'Failed' )) {
        // elicitResponse is finishing up as the LexBot has fulfilled its intent.
        // we use a fakeHit with either the Bot's message or an empty string.
        let fakeHit = {};
        fakeHit.a = res.message ? res.message : '';
        [req, res, hit] = await evaluateConditionalChaining(req, res, fakeHit, elicitResponseChainingConfig);
    } else {
        // elicitResponse is not involved. obtain the next question to serve up to the user.
        if (req._settings.LLM_GENERATE_QUERY_ENABLE) {
            if (! isQidQuery(req)) {
                req = await llm.generate_query(req);
            } else {
                qnabot.debug("QID specified in query - do not generate LLM query.");
            }
        }
        [req, res, hit] = await get_hit(req, res);
    }
    if (hit) {
        // found a result.
        var c=0;
        while (_.get(hit, 'conditionalChaining') && _.get(hit, 'elicitResponse.responsebot_hook', '') === '' ) {
            c++;
            // ElicitResonse is not involved and this document has conditionalChaining defined. Process the
            // conditionalChaining in this case.
            [req, res, hit] = await evaluateConditionalChaining(req, res, hit, hit.conditionalChaining);
            qnabot.log('Chained doc count: ', c);
            if (c >= 10) {
                qnabot.log('Reached Max limit of 10 chained documents (safeguard to prevent infinite loops).') ;
                break ;
            }
        }
        // update conversation memory in userInfo (will be automatically persisted later to DynamoDB userinfo table)
        const chatMessageHistory = await llm.chatMemoryParse(_.get(req._userInfo, "chatMessageHistory","[]"), req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
        chatMessageHistory.addUserMessage(llm.get_question(req));
        let aiMessage = hit.a || "<empty>";
        // remove prefix message and timing debug info, if any, before storing message
        aiMessage = aiMessage.replace(new RegExp(req._settings.LLM_QA_PREFIX_MESSAGE + "\\s*(\\(.*?\\))*", 'g'), '').trim();
        chatMessageHistory.addAIChatMessage(aiMessage || "<empty>");
        res._userInfo.chatMessageHistory = await llm.chatMemorySerialise(chatMessageHistory, req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);

        // translate response
        var usrLang = 'en';
        const autotranslate = _.get(hit, 'autotranslate', true);

        if (_.get(req._settings, 'ENABLE_MULTI_LANGUAGE_SUPPORT')) {
            usrLang = _.get(req, 'session.qnabotcontext.userLocale');
            if (usrLang != 'en' && autotranslate) {
                qnabot.log('Autotranslate hit to usrLang: ', usrLang);
                hit = await translate.translate_hit(hit, usrLang,req);
            } else {
                qnabot.log('Autotranslate not required.');
            }
        }
        // prepend debug msg
        if (_.get(req._settings, 'ENABLE_DEBUG_RESPONSES')) {
            let original_input, translated_input, llm_generated_query;
            if (req.llm_generated_query) {
                if (usrLang != 'en') {
                    original_input = _.get(req,'_event.origQuestion','notdefined');
                    const translated_input = req.llm_generated_query.orig;
                    const llm_generated_query = req.llm_generated_query.result;
                    const search_string = req.llm_generated_query.concatenated;
                    const timing = req.llm_generated_query.timing;
                    msg = `User Input: "${original_input}", Translated to: "${translated_input}", LLM generated query (${timing}): "${llm_generated_query}", Search string: "${search_string}"`
                } else {
                    original_input = req.llm_generated_query.orig;
                    llm_generated_query = req.llm_generated_query.result;
                    const search_string = req.llm_generated_query.concatenated;
                    const timing = req.llm_generated_query.timing;
                    msg = `User Input: "${original_input}", LLM generated query (${timing}): "${llm_generated_query}", Search string: "${search_string}"`;
                }
            } else {
                if (usrLang != 'en') {
                    original_input = _.get(req,'_event.origQuestion','notdefined');
                    translated_input = req.question;
                    msg = `User Input: "${original_input}", Translated to: "${translated_input}"`;
                } else {
                    original_input = req.question;
                    msg = `User Input: "${original_input}"`;
                }               
            }

            let qid = _.get(req, 'qid');
            if (qid) {
                msg += ', Lex Intent matched QID "' + qid + '"' ;
            }
            if(req.debug && req.debug.length)
            {
                msg += JSON.stringify(req.debug,2)
            }
            msg += ', Source: ' + _.get(hit, 'answersource', 'unknown');
            var debug_msg = {
                a: '[' + msg + '] ',
                alt: {
                    markdown: '*[' + msg + ']*  \n',
                    ssml: '<speak>' + msg + '</speak>'
                },
                rp: '[' + _.get(hit, 'rp') + '] '

            };
            hit = merge_next(debug_msg, hit) ;
        }
        res = update_res_with_hit(req, res, hit);
    } else {
        // no hit found
        res.type = 'PlainText';
        res.message = _.get(req, '_settings.EMPTYMESSAGE', 'You stumped me!');
    }
    // add session attributes for qid and no_hits - useful for Amazon Connect integration
    res.session.qnabot_qid = _.get(res.result, 'qid', '') ;
    res.session.qnabot_gotanswer = (res['got_hits'] > 0) ? true : false ;

    let event = {req, res} ;
    return event;
}

function process_slots(req, res, hit) {
    let qid_slots = _.get(hit,'slots');
    let nextSlotToElicit;
    if (qid_slots) {
        for (let slot of qid_slots) {
            let slotName = _.get(slot,'slotName');
            let slotValue = _.get(req, `slots.${slotName}`);
            let slotRequired = _.get(slot,'slotRequired',false);
            let slotValueCached = _.get(slot, 'slotValueCached');
            let slot_sessionAttrName = 'qnabotcontext.slot.' + slotName ;
            if (slotValue) {
                qnabot.log(`Slot ${slotName} already filled: ${slotValue}`);
                _.set(res, `slots.${slotName}`, slotValue);
                if (slotValueCached) {
                    qnabot.log(`Slot value caching enabled for: '${slotName}' setting session attribute '${slot_sessionAttrName}'`);
                    _.set(res.session, slot_sessionAttrName, slotValue);
                }
            }
            if (!slotValue) {
                if (slotValueCached) {
                    qnabot.log(`Slot value caching enabled for: '${slotName}' using session attribute '${slot_sessionAttrName}'`);
                    let value = _.get(res.session, slot_sessionAttrName);
                    if (value) {
                        qnabot.log(`Filling slot ${slotName} using cached value: ${value}`);
                        _.set(res, `slots.${slotName}`, value);
                    } else {
                        qnabot.log(`No cached value for slot ${slotName}`);
                        _.set(res, `slots.${slotName}`, null);
                        if (slotRequired && !nextSlotToElicit) {
                            nextSlotToElicit = slotName;
                        }
                    }
                } else {
                    qnabot.log(`Slot value caching is not enabled for: ${slotName}`);
                    _.set(res, `slots.${slotName}`, null);
                    if (slotRequired && !nextSlotToElicit) {
                        nextSlotToElicit = slotName;
                    }
                }
            }
        }
        qnabot.log(`Set next slot to elicit: ${nextSlotToElicit}`);
        res.nextSlotToElicit = nextSlotToElicit;
    }
    // Placeholder to add optional lambda hook for slot validation / runtime hints, etc. (future)
    return res;
}

async function processDialogEvent(req, res) {
    qnabot.log('Process Dialog Code Hook event');
    // retrieve QID item that was mapped to intent
    let qid = _.get(req, 'qid');
    if (qid) {
        let question = `QID::${qid}`;
        qnabot.log(`QID identified in request: ${qid}`)
        var query_params = {
            question: question,
            from: 0,
            size: 1
        };
        var response = await open_es.run_query_es(req, query_params);
        qnabot.log('QID query response: ', JSON.stringify(response,null,2));
        var hit = _.get(response, 'hits.hits[0]._source');
        res = process_slots(req, res, hit);
        _.set(res, 'session.qnabot_qid', qid);
    } else {
        qnabot.error('QID not identified in request. Intent name should have mapped to a QID. Unable to process Dialog Code Hook event');
    }
    let event = {req, res} ;
    return event;
}

module.exports = async function (req, res) {
    qna_settings.set_environment_variables(req._settings)
    let event = {};
    if (_.get(req,'invocationSource') === 'DialogCodeHook') {
        event = await processDialogEvent(req,res);
    } else {
        event = await processFulfillmentEvent(req,res);
    }
    qnabot.debug('RESULT', JSON.stringify(event));
    return event ;
};
