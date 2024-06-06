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

function updateSessionNavigation(res, req) {
    const previousQid = _.get(res, 'session.qnabotcontext.previous.qid', false);
    const navigationJson = _.get(res, 'session.qnabotcontext.navigation', false);
    const previousArray = _.get(res, 'session.qnabotcontext.navigation.previous', []);
    if (previousQid != _.get(res.result, 'qid')
        && !(_.get(navigationJson, 'hasParent', true))
        && req._info.es.type == 'qna') {
        // NOSONAR-start
        // Repetitive code done to reduce cognitive complexity
        if (previousArray.length == 0) {
            previousArray.push(previousQid);
        } else if (previousArray[previousArray.length - 1] != previousQid) {
            previousArray.push(previousQid);
        }
        // NOSONAR-end
    }
    if (previousArray.length > 10) {
        previousArray.shift();
    }
    let hasParent = true;
    if ('next' in res.result) {
        hasParent = false;
    }
    _.set(res, 'session.qnabotcontext.previous', {
        qid: _.get(res.result, 'qid'),
        q: req.question,
    });
    _.set(res, 'session.qnabotcontext.navigation', {
        next: _.get(res.result, 'next', _.get(res, 'session.qnabotcontext.navigation.next', '')),
        previous: previousArray,
        hasParent,
    });

    return res;
}

function addSessionAttributes(hit, res) {
    if (_.get(hit, 'sa')) {
        hit.sa.map((obj) => {
            _.set(res, `session.${obj.text}`, obj.value);
        });
    }
    return res;
}

function addTags(hit, res) {
    const tags = _.get(hit, 'tags');
    if (tags) {
        _.set(res, 'tags', tags);
    }

    return res;
}

function addAnswerSource(ansSource, res) {
    if (ansSource === 'Kendra FAQ') {
        // kendra fallback sets answerSource directly
        res.answerSource = 'KENDRA FAQ';
    } else if (ansSource === 'OpenSearch' || ansSource === 'OpenSearch Fallback') {
        res.answerSource = 'OPENSEARCH';
    } else {
        res.answerSource = ansSource;
    }

    return res;
}

function updateSsml(req, res) {
    if (req._preferredResponseType == 'SSML') {
        if (_.get(res, 'result.alt.ssml')) {
            res.type = 'SSML';
            res.message = res.result.alt.ssml.replace(/\r?\n|\r/g, ' ');
        }
    }

    return res;
}

function addAltMessages(res) {
    let tmp;
    try {
        tmp = JSON.parse(_.get(res, 'session.appContext', '{}'));
    } catch (e) {
        tmp = _.get(res, 'session.appContext', '{}');
    }
    tmp.altMessages = _.get(res, 'result.alt', {});
    _.set(res, 'session.appContext', tmp);

    return res;
}

function addCard(res) {
    const card = _.get(res, 'result.r.title') ? res.result.r : null;

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

    return res;
}

function addReprompt(res) {
    let rp = _.get(res, 'result.rp');
    if (rp) {
        let type = 'PlainText';

        if (rp.includes('<speak>')) {
            type = 'SSML';
            rp = rp.replace(/\r?\n|\r/g, ' ');
        }
        _.set(res, 'reprompt', { type, text: rp });
    }
    return res;
}

function updateResWithHit(req, res, hit) {
    res.result = hit;
    res.type = 'PlainText';
    res.message = res.result.a;
    res.plainMessage = res.result.a;

    // add question defined session attributes to res with the exception of qnabotcontext and appContext
    res = addSessionAttributes(hit, res);

    // Add tags to the res object
    res = addTags(hit, res);

    // Add answerSource for query hits
    const ansSource = _.get(hit, 'answersource', 'unknown');
    res = addAnswerSource(ansSource, res);

    // Add alt messages to appContext session attribute JSON value (for lex-web-ui)
    res = addAltMessages(res);

    // Add reprompt
    res = addReprompt(res);

    res = updateSsml(req, res);

    qnabot.log(res.message);

    res = addCard(res);

    res = updateSessionNavigation(res, req);
    res.session.qnabot_qid = _.get(res.result, 'qid', '');
    res.session.qnabot_gotanswer = res.got_hits > 0;
    return res;
}
exports.updateResWithHit = updateResWithHit;
