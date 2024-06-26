/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const staticEval = require('static-eval');
const { invokeLambda } = require('./invokeLambda');
const { mergeNext } = require('./mergeNext');
const { encryptor } = require('./encryptor');
const { getHit } = require('./getHit');
const esprimaParse = require('esprima').parse;


function handleErrors(message, errors) {
    qnabot.log(message);
    const error = {
        message,
    };
    if (!errors.includes(error)) {
        errors.push(error);
    };
};

/**
 * Evaluate conditional chaining to determine the next question.
 * @param req
 * @param res
 * @param conditionalChaining
 * @param errors
 * @param next_q
 * @returns next_q
 */

async function evaluateNextQuestion(conditionalChaining, req, res, errors, next_q) {
    if (conditionalChaining.toLowerCase().startsWith('lambda::')) {
        // Chaining rule is a Lambda function
        const lambdaName = conditionalChaining.split('::')[1];
        let payload;
        [req, res, payload] = await invokeLambda(lambdaName, req, res); // NOSONAR req and res are referenced by lodash
        qnabot.log('Chaining Rule Lambda response payload: ', payload);
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            const message = `Parsing Lambda response payload returned from ${lambdaName} failed.`;
            handleErrors(message, errors);
        }
        if (_.get(payload, 'req') && _.get(payload, 'res')) {
            next_q = _.get(payload, 'req.question');
        } else {
            qnabot.log('Chaining Rules Lambda did not return session event in response.');
            qnabot.log('assume response is a simple string containing next_q value');
            next_q = payload;
        }
    } else {
        // create chaining rule safeEval context, aligned with Handlebars context
        const sandbox = {
            LexOrAlexa: req._type,
            UserInfo: req._userInfo,
            SessionAttributes: res.session,
            Slots: req.slots,
            Settings: req._settings,
            Question: req.question,
            OrigQuestion: _.get(req, '_event.origQuestion', req.question),
            PreviousQuestion: _.get(req, 'session.qnabotcontext.previous.q', false),
            Sentiment: req.sentiment,
        };
        qnabot.log('Evaluating:', conditionalChaining);
        qnabot.debug('Sandbox:', JSON.stringify(sandbox, null, 2));
        // safely evaluate conditionalChaining expression.. throws an exception if there is a syntax error
        const ast = esprimaParse(conditionalChaining).body[0].expression;
        try {
            next_q = staticEval(ast, sandbox);
        } catch (e) {
            const message = `Syntax Error evaluating conditional chaining rule: ${conditionalChaining}`;
            handleErrors(message, errors);
        }
    }
    return next_q;
};

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
    let next_q;
    let errors = [];
    // If chaining rule a lambda, or an expression?
    next_q = await evaluateNextQuestion(conditionalChaining, req, res, errors, next_q);
    qnabot.log('Chained document rule evaluated to:', next_q);

    // Remove qid if set by slots - this would override the chained item
    if(req.hasOwnProperty('qid')) {
        delete req['qid'];
    }

    let hit2;
    if (next_q) {
        req.question = next_q;
        [req, res, hit2, errors] = await getHit(req, res);
    }
    // if the question we are chaining to, also has conditional chaining, be sure to navigate set up
    // next user input to elicitResponse from this lex Bot.
    if (hit2) {
        const responsebot_hook = _.get(hit2, 'elicitResponse.responsebot_hook', undefined);
        const responsebot_session_namespace = _.get(hit2, 'elicitResponse.response_sessionattr_namespace', undefined);
        const chaining_configuration = _.get(hit2, 'conditionalChaining', undefined);
        const elicitResponse = {};

        elicitResponse.responsebot = undefined;
        elicitResponse.namespace = undefined;
        elicitResponse.chainingConfig = chaining_configuration;

        if (responsebot_hook && responsebot_session_namespace) {
            elicitResponse.responsebot = responsebot_hook;
            elicitResponse.namespace = responsebot_session_namespace;
            _.set(res.session, `${res.session.elicitResponseNamespace}.boterror`, undefined);
        }
        _.set(res.session, 'qnabotcontext.elicitResponse', elicitResponse);
        const mergedhit = mergeNext(hit, hit2);
        return [req, res, mergedhit, errors];
    }
    qnabot.log('WARNING: No documents found for evaluated chaining rule:', next_q);
    return [req, res, hit, errors];
}
exports.evaluateConditionalChaining = evaluateConditionalChaining;