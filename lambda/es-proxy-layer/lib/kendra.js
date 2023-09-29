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

/* eslint-disable max-len */
const _ = require('lodash');
const linkify = require('linkifyjs');
const open_es = require('./es_query');

/**
 * optional environment variables - These are not used defined during setup of this function in QnABot but are
 * useful for testing if defined.
 *
 * REGION - optional AWS region to target
 * KENDRA_INDEX - optional string defining index to query
 *
 */

const AWS = require('aws-sdk');

let kendraIndexes;
const qnabot = require('qnabot/logging');

function allow_kendra_result(kendra_result, minimumScore, response_types) {
    if (!type_filter(response_types, kendra_result)) {
        qnabot.log(`Result removed: Type [${kendra_result.Type}] not in allowed types [${response_types}] - Passage: ${_.get(kendra_result, 'DocumentExcerpt.Text')}`);
        return false;
    }
    if (!confidence_filter(minimumScore, kendra_result)) {
        qnabot.log(`Result removed: ScoreConfidence [${_.get(kendra_result, 'ScoreAttributes.ScoreConfidence')}] below threshold [${minimumScore}] - Passage: ${_.get(kendra_result, 'DocumentExcerpt.Text')}`);
        return false;
    }
    qnabot.log(`Result allowed: Type [${kendra_result.Type}], ScoreConfidence [${_.get(kendra_result, 'ScoreAttributes.ScoreConfidence')}] - Passage: ${_.get(kendra_result, 'DocumentExcerpt.Text')}`);
    return true;
}

function confidence_filter(minimumScore, kendra_result) {
    let confidences = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
    const index = confidences.findIndex((i) => i == minimumScore.toUpperCase());
    if (index == undefined) {
        qnabot.log('Warning: ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE should be one of \'VERY_HIGH\'|\'HIGH\'|\'MEDIUM\'|\'LOW\'');
        return true;
    }
    confidences = confidences.slice(index);
    const found = confidences.find((element) => element == _.get(kendra_result, 'ScoreAttributes.ScoreConfidence')) != undefined;
    return found;
}

function type_filter(response_types, kendra_result) {
    return response_types.includes(kendra_result.Type);
}
function create_hit(answermessage, markdown, ssml, hit_count, debugResults, kendra) {
    const hits = {
        a: answermessage,
        alt: {
            markdown,
            ssml,
        },
        type: 'text',
        questions: [
        ],
        answersource: 'KENDRA FALLBACK',
        kendra,
        hit_count,
        debug: debugResults.slice(0, kendra.maxDocuments),
    };

    qnabot.log(`create_hit${JSON.stringify(hits)}`);
    return hit_count > 0 ? hits : undefined;
}

function create_debug_object(kendra_result) {
    return {
        Type: kendra_result.Type,
        Score: _.get(kendra_result, 'ScoreAttributes.ScoreConfidence'),
    };
}

/**
 * Function to bold highlights in Kendra answer by adding markdown
 * @param {string} textIn
 * @param {number} hlBeginOffset
 * @param {number} hlEndOffset
 * @param {boolean} highlightOnly
 * @returns {string}
 */
function addMarkdownHighlights(textIn, hlBeginOffset, hlEndOffset, highlightOnly = false) {
    const beginning = textIn.substring(0, hlBeginOffset);
    const highlight = textIn.substring(hlBeginOffset, hlEndOffset);
    const rest = textIn.substring(hlEndOffset);
    let textOut = textIn; // default
    // add markdown only if highlight is not in the middle of a url/link..
    if (!isHighlightInLink(textIn, hlBeginOffset)) {
        if (highlightOnly) {
            textOut = `**${highlight}**`;
        } else {
            textOut = `${beginning}**${highlight}**${rest}`;
        }
    }
    return textOut;
}

function isHighlightInLink(textIn, hlBeginOffset) {
    const links = linkify.find(textIn);
    for (const link of links) {
        const linkText = link.value;
        const linkBeginOffset = textIn.indexOf(linkText);
        const linkEndOffset = linkBeginOffset + linkText.length;
        if (hlBeginOffset >= linkBeginOffset && hlBeginOffset <= linkEndOffset) {
            return true;
        }
    }
    return false;
}

/**
 * Function to query kendraClient and return results via Promise
 * @param kendraClient
 * @param params
 * @param resArray
 * @returns {*}
 */
function kendraRequester(kendraClient, params, resArray) {
    return new Promise((resolve, reject) => {
        qnabot.log(`Kendra request params:${JSON.stringify(params, null, 2)}`);
        kendraClient.query(params, (err, data) => {
            const indexId = params.IndexId;
            if (err) {
                qnabot.log(err, err.stack);
                reject(`Error from Kendra query request:${err}`);
            } else {
                data.originalKendraIndexId = indexId;
                qnabot.log(`Kendra response:${JSON.stringify(data, null, 2)}`);
                resArray.push(data);
                resolve(data);
            }
        });
    });
}

/**
 * Function to sort and merge overlapping intervals
 * @param intervals
 * @returns [*]
 * Source: https://gist.github.com/vrachieru/5649bce26004d8a4682b
 */
function mergeIntervals(intervals) {
    // test if there are at least 2 intervals
    if (intervals.length <= 1) { return intervals; }

    const stack = [];
    let top = null;

    // sort the intervals based on their start values
    intervals.sort((a, b) => a[0] - b[0]);

    // push the 1st interval into the stack
    stack.push(intervals[0]);

    // start from the next interval and merge if needed
    for (let i = 1; i < intervals.length; i++) {
    // get the top element
        top = stack[stack.length - 1];

        // if the current interval doesn't overlap with the
        // stack top element, push it to the stack
        if (top.EndOffset < intervals[i].BeginOffset) {
            stack.push(intervals[i]);
        }
        // otherwise update the end value of the top element
        // if end of current interval is higher
        else if (top.EndOffset < intervals[i].EndOffset) {
            top.EndOffset = intervals[i].EndOffset;
            stack.pop();
            stack.push(top);
        }
    }

    return stack;
}

function signS3URL(url, expireSecs) {
    let bucket; let
        key;
    if (url.search(/\/s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/) != -1) {
        // bucket in path format
        bucket = url.split('/')[3];
        key = url.split('/').slice(4).join('/');
    }
    if (url.search(/\.s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/) != -1) {
        // bucket in hostname format
        const hostname = url.split('/')[2];
        bucket = hostname.split('.')[0];
        key = url.split('/').slice(3).join('/');
    }
    if (bucket && key) {
        qnabot.debug('Convert S3 url to a signed URL: ', url, 'Bucket: ', bucket, ' Key: ', key);
        try {
            const s3 = new AWS.S3();
            const signedurl = s3.getSignedUrl('getObject', {
                Bucket: bucket,
                Key: key,
                Expires: expireSecs,
            });
            qnabot.log('Signed URL: ', signedurl);
            url = signedurl;
        } catch (err) {
            qnabot.log('Error signing S3 URL (returning original URL): ', err);
        }
    } else {
        qnabot.debug('URL is not an S3 url - return unchanged: ', url);
    }
    return url;
}

// get document name from URL
// last element of path with any params removed
function docName(uri) {
    if (uri.DocumentTitle) {
        return uri.Title;
    }
    if (uri.Uri) {
        uri = uri.Uri;
    }
    const x = uri.split('/');
    const y = x[x.length - 1];
    const n = y.split('?')[0];
    return n;
}

/**
 * Function to return the longest interval from a list of sorted intervals
 * @param intervals
 * @returns {*}
 */
function longestInterval(intervals) {
    // test if there are at least 2 intervals
    if (intervals.length == 0) {
        return intervals;
    } else if (intervals.length == 1) {
        return intervals[0];
    }

    // sort the intervals based on their length
    intervals.sort((a, b) => (a[1] - a[0]) - (b[1] - b[0]));
    return intervals[0];
}

function isSyncedFromQnABot(kendra_result) {
    if (!open_es.hasJsonStructure(kendra_result.DocumentURI)) {
        return false;
    }

    const hit = JSON.parse(kendra_result.DocumentURI);
    if (_.get(hit, '_source_qid')) {
        qnabot.warn('The Kendra result was synced from QnABot. Skipping...');
        return true;
    }
    return false;
}

/** Function that processes kendra requests and handles response. Decides whether to handle SNS
 * events or Lambda Hook events from QnABot.
 * @param event - input event passed to the Lambda Handler
 * @param context - input context passed to the Lambda Handler
 * @returns {Promise<*>} - returns the response in event.res
 */
async function routeKendraRequest(event, context) {
    // remove any prior session attributes for kendra
    _.unset(event, 'res.session.qnabotcontext.kendra.kendraQueryId');
    _.unset(event, 'res.session.qnabotcontext.kendra.kendraIndexId');
    _.unset(event, 'res.session.qnabotcontext.kendra.kendraResultId');
    _.unset(event, 'res.session.qnabotcontext.kendra.kendraResponsibleQid');

    const promises = [];
    const resArray = [];
    const kendraClient = getKendraClient(event);

    // process query against Kendra for QnABot
    const kendraIndexes = getKendraIndexes(event);

    const kendraResultsCached = _.get(event.res, 'kendraResultsCached');

    const { origQuestion } = event.req._event;
    const { question } = event.req;
    const useOriginalLanguageQuery = shouldUseOriginalLanguageQuery(event, origQuestion, question);

    // This function can handle configuration with an array of kendraIndexes.
    // Iterate through this area and perform queries against Kendra.
    kendraIndexes.forEach((index, i) => {
        // if results cached from KendraFAQ, skip index by pushing Promise to resolve cached results
        if (kendraResultsCached && index === kendraResultsCached.originalKendraIndexId && !useOriginalLanguageQuery) {
            qnabot.log('retrieving cached kendra results');
            promises.push(new Promise((resolve, reject) => {
                const data = kendraResultsCached;
                _.set(event.req, 'kendraResultsCached', 'cached and retrieved'); // cleans the logs
                data.originalKendraIndexId = index;
                qnabot.log(`Data from Kendra request:${JSON.stringify(data, null, 2)}`);
                resArray.push(data);
                resolve(data);
            }));
            return;
        }

        const params = getKendraParams(index, useOriginalLanguageQuery, origQuestion, question, event);
        const p = kendraRequester(kendraClient, params, resArray);
        promises.push(p);
    });

    // wait for all kendra queries to complete
    await Promise.all(promises);

    // process kendra query responses and update answer content
    return generateAnswerFromKendra(event, resArray, useOriginalLanguageQuery);
}

exports.handler = async (event, context) => {
    qnabot.log(`event: ${JSON.stringify(event, null, 2)}`);
    return routeKendraRequest(event, context);
};

function getAnswerMsg(element, returnTopAnswer, seenTop, answerMessageMd, topAnswerMessageMd, answerMessage, topAnswerMessage, speechMessage) {
    // Emboldens the highlighted phrases returned by the Kendra response API in markdown format
    let answerTextMd = element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, ' ');
    // iterates over the answer highlights in sorted order of BeginOffset, merges the overlapping intervals
    const sorted_highlights = mergeIntervals(element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Highlights);
    let j; let
        elem;
    for (j = 0; j < sorted_highlights.length; j++) {
        elem = sorted_highlights[j];
        const offset = 4 * j;

        answerTextMd = addMarkdownHighlights(answerTextMd, elem.BeginOffset + offset, elem.EndOffset + offset, true);

        if (returnTopAnswer && elem.TopAnswer == true) { // if top answer is found, then answer is abbreviated to this phrase
            seenTop = true;
            answerMessageMd = topAnswerMessageMd;
            answerMessage = `${topAnswerMessage + answerTextMd}.`;
            speechMessage = answerTextMd;
            break;
        }
    }
    answerMessageMd = `${answerMessageMd}\n\n${answerTextMd}`;

    // Shortens the speech response to contain say the longest highlighted phrase ONLY IF top answer not found
    speechMessage = shortenSpeechMsg(seenTop, sorted_highlights, element, speechMessage);
    return {
        answerTextMd, seenTop, answerMessageMd, answerMessage, speechMessage,
    };
}

function buildDocInfoAndSpeechMsg(seenTop, element, allFilteredMessages, foundAnswerCount, foundDocumentCount, speechMessage) {
    const docInfo = {};
    // if topAnswer found, then do not show document excerpts
    if (!seenTop) {
        docInfo.text = element.DocumentExcerpt.Text.replace(/\r?\n|\r/g, ' ');
        allFilteredMessages.push(docInfo.text);
        // iterates over the document excerpt highlights in sorted order of BeginOffset, merges overlapping intervals
        const sorted_highlights = mergeIntervals(element.DocumentExcerpt.Highlights);
        let j; let
            elem;
        for (j = 0; j < sorted_highlights.length; j++) {
            elem = sorted_highlights[j];
            const offset = 4 * j;
            const beginning = docInfo.text.substring(0, elem.BeginOffset + offset);
            const highlight = docInfo.text.substring(elem.BeginOffset + offset, elem.EndOffset + offset);
            const rest = docInfo.text.substr(elem.EndOffset + offset);
            docInfo.text = `${beginning}**${highlight}**${rest}`;
        }

        if (foundAnswerCount == 0 && foundDocumentCount == 0) {
            speechMessage = element.DocumentExcerpt.Text.replace(/\r?\n|\r/g, ' ');
            if (sorted_highlights.length > 0) {
                const highlight = speechMessage.substring(sorted_highlights[0].BeginOffset, sorted_highlights[0].EndOffset);
                const pattern = new RegExp(`[^.]* ${highlight}[^.]*\.[^.]*\.`);
                pattern.lastIndex = 0; // must reset this property of regex object for searches
                const regexMatch = pattern.exec(speechMessage);
                // NOSONAR TODO: Investigate this.  Should this be a nohits scenerio?
                if (regexMatch) {
                    speechMessage = regexMatch[0];
                }
            }
        }
    }
    // but even if topAnswer is found, show URL in markdown
    docInfo.uri = `${element.DocumentURI}`;

    if (element.DocumentTitle && element.DocumentTitle.Text) {
        docInfo.Title = element.DocumentTitle.Text;
    }
    return { docInfo, speechMessage };
}


function shortenSpeechMsg(seenTop, sorted_highlights, element, speechMessage) {
    if (!seenTop) {
        const longest_highlight = longestInterval(sorted_highlights);
        const answerText = element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, ' ');
        const pattern = new RegExp(`[^.]* ${longest_highlight}[^.]*\.[^.]*\.`);
        pattern.lastIndex = 0; // must reset this property of regex object for searches
        speechMessage = pattern.exec(answerText)[0];
    }
    return speechMessage;
}

function getKendraParams(index, useOriginalLanguageQuery, origQuestion, question, event) {
    let params = {
        IndexId: index,
        QueryText: useOriginalLanguageQuery ? origQuestion : question, /* required */
    };
    const kendraQueryArgs = _.get(event.req, 'kendraQueryArgs', []);
    qnabot.log(`Kendra query args: ${kendraQueryArgs}`);
    for (const argString of kendraQueryArgs) {
        qnabot.log(`Adding parameter '${argString}'`);
        const argJSON = `{ ${argString} }`; // convert k:v to a JSON obj
        const arg = JSON.parse(argJSON);
        params = _.assign(params, arg);
    }
    return params;
}

function getAnswerTextMd(element) {
    let answerTextMd = element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, ' ');
    // iterates over the FAQ answer highlights in sorted order of BeginOffset, merges the overlapping intervals
    const sorted_highlights = mergeIntervals(element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Highlights);
    let j; let
        elem;
    for (j = 0; j < sorted_highlights.length; j++) {
        elem = sorted_highlights[j];
        const offset = 4 * j;
        answerTextMd = addMarkdownHighlights(answerTextMd, elem.BeginOffset + offset, elem.EndOffset + offset, false);
    }
    return answerTextMd;
}

function getKendraClient(event) {
    let kendraClient;

    // if test environment, then use mock-up of kendraClient
    if (event.test) {
        const mockup = `./test/mockClient${event.test}.js`;
        kendraClient = require(mockup);
    } else {
        AWS.config.update({
            maxRetries: _.get(event.req._settings, 'KENDRA_FAQ_CONFIG_MAX_RETRIES'),
            retryDelayOptions: {
                base: _.get(event.req._settings, 'KENDRA_FAQ_CONFIG_RETRY_DELAY'),
            },
        });
        kendraClient = (process.env.REGION
            ? new AWS.Kendra({ apiVersion: '2019-02-03', region: process.env.REGION })
            : new AWS.Kendra({ apiVersion: '2019-02-03' })
        );
    }
    return kendraClient;
}

function getMarkdownMessage(answerMessageMd, answerMessage, event, answerDocumentUris, foundAnswerCount, seenTop, helpfulDocumentsUris, maxDocumentCount) {
    let markdown = answerMessageMd;
    let message = answerMessage;

    const helpfulLinksMsg = 'Source Link';
    const signS3Urls = _.get(event.req, '_settings.ALT_SEARCH_KENDRA_S3_SIGNED_URLS', true);
    const expireSeconds = _.get(event.req, '_settings.ALT_SEARCH_KENDRA_S3_SIGNED_URL_EXPIRE_SECS', 300);
    if (answerDocumentUris.size > 0) {
        markdown += `\n\n ${helpfulLinksMsg}: `;
        answerDocumentUris.forEach((element) => {
            // Convert S3 Object URLs to signed URLs
            if (signS3Urls) {
                element.DocumentURI = signS3URL(element.DocumentURI, expireSeconds);
            }
            markdown += `<span translate=no>[${element.DocumentTitle.Text}](${element.DocumentURI})</span>`;
        });
    }

    if (seenTop) {
        return [message, markdown];
    }

    let idx = foundAnswerCount;
    helpfulDocumentsUris.forEach((element) => {
        if (idx++ < maxDocumentCount) {
            markdown += '\n\n';
            markdown += '***';
            markdown += '\n\n <br>';

            if (element.text && event.req._preferredResponseType != 'SSML') { // don't append doc search to SSML answers
                markdown += `\n\n  ${element.text}`;
                message += `\n\n  ${element.text}`;
            }
            const label = element.Title;
            // Convert S3 Object URLs to signed URLs
            if (signS3Urls) {
                element.uri = signS3URL(element.uri, expireSeconds);
            }
            markdown += `\n\n  ${helpfulLinksMsg}: <span translate=no>[${label}](${element.uri})</span>`;
            message += `\n\n  ${helpfulLinksMsg}: ${element.uri}`;
        }
    });

    return [message, markdown];
}

function getSsmlMessage(foundAnswerCount, foundDocumentCount, answerMessage, speechMessage, useFullMessageForSpeech, allFilteredMessages) {
    let ssmlMessage = '';
    if (foundAnswerCount > 0 || foundDocumentCount > 0) {
        ssmlMessage = `${answerMessage.substring(0, 600).replace(/\r?\n|\r/g, ' ')}`;
        if (speechMessage != '') {
            ssmlMessage = `${speechMessage.substring(0, 600).replace(/\r?\n|\r/g, ' ')}`;
        }

        const lastIndex = ssmlMessage.lastIndexOf('.');
        if (lastIndex > 0) {
            ssmlMessage = ssmlMessage.substring(0, lastIndex);
        }
        ssmlMessage = `<speak> ${ssmlMessage} </speak>`;
    }
    if (useFullMessageForSpeech) {
        ssmlMessage = allFilteredMessages.length > 0 ? allFilteredMessages[0] : ssmlMessage;
    }
    return ssmlMessage;
}

function shouldUseOriginalLanguageQuery(event, origQuestion, question) {
    const userDetectedLocale = _.get(event.req, 'session.qnabotcontext.userLocale');
    const standaloneQuery = _.get(event.req, 'llm_generated_query.concatenated');
    const kendraIndexedLanguages = _.get(
        event.req._settings,
        'KENDRA_INDEXED_DOCUMENTS_LANGUAGES',

        ['en'],
    );
    qnabot.log(`Retrieved Kendra multi-language settings: ${kendraIndexedLanguages}`);

    let useOriginalLanguageQuery = kendraIndexedLanguages.includes(userDetectedLocale, 0)
        && origQuestion && question && origQuestion !== question;
    if (standaloneQuery) {
        useOriginalLanguageQuery = false;
        qnabot.log(`Using LLM generated standalone query: ${standaloneQuery}`);
    }
    qnabot.log(`useOriginalLanguageQuery: ${useOriginalLanguageQuery}`);
    return useOriginalLanguageQuery;
}

function getKendraIndexes(event) {
    const indexes = event.req._settings.ALT_SEARCH_KENDRA_INDEXES ? event.req._settings.ALT_SEARCH_KENDRA_INDEXES : process.env.KENDRA_INDEXES;
    if (indexes && indexes.length) {
        try {
            // parse JSON array of kendra indexes
            kendraIndexes = JSON.parse(indexes);
        } catch (err) {
            // assume setting is a string containing single index
            kendraIndexes = [indexes];
        }
    }
    if (kendraIndexes === undefined) {
        throw new Error('Undefined Kendra Indexes');
    }

    return kendraIndexes;
}

function isDocType(element) {
    return element.Type === 'DOCUMENT' && element.DocumentExcerpt.Text;
}

function isQaType(element) {
    return element.Type === 'QUESTION_ANSWER' && element.AdditionalAttributes?.length > 1 && !isSyncedFromQnABot(element);
}

function isAnswerType(element, foundAnswerCount) {
    return element.Type === 'ANSWER' && foundAnswerCount === 0 && element.AdditionalAttributes?.length > 0
        && element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text;
}

function appendQueryAndIndexId(items, QueryId, originalKendraIndexId) {
    return items.map((item) => {
        const itemToAttach = item;
        itemToAttach.QueryId = QueryId;
        itemToAttach.originalKendraIndexId = originalKendraIndexId;
        return itemToAttach;
    });
}

function getResultItems(resArray, minimumScore, searchTypes) {
    const elements = resArray.reduce((acc, result) => {
        const items = appendQueryAndIndexId(result.ResultItems, result.QueryId, result.originalKendraIndexId);
        return acc.concat(items);
    }, []);
    return elements.filter((element) => allow_kendra_result(element, minimumScore, searchTypes));
}

function generateAnswerFromKendra(event, resArray, useOriginalLanguageQuery) {
    // when not using LLM QA, if Kendra results contain topAnswer we return that, and ignore all else..
    // BUT this is not helpful when using the LLM to generate an answer.. in this case we should not apply
    // any special handling for 'top answer'
    const returnTopAnswer = !(_.get(event.req._settings, 'LLM_QA_ENABLE'));

    /* default message text - can be overridden using QnABot SSM Parameter Store Custom Property */
    const topAnswerMessage = `${event.req._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE}\n\n`; // "Amazon Kendra suggested answer. \n\n ";
    const topAnswerMessageMd = event.req._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE == '' ? '' : `*${event.req._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE}* \n `;
    let answerMessage = event.req._settings.ALT_SEARCH_KENDRA_ANSWER_MESSAGE;
    let answerMessageMd = event.req._settings.ALT_SEARCH_KENDRA_ANSWER_MESSAGE == '' ? '' : `**${answerMessage}** \n `;
    const faqanswerMessage = `${event.req._settings.ALT_SEARCH_KENDRA_FAQ_MESSAGE}\n\n`; // 'Answer from Amazon Kendra FAQ.'
    const faqanswerMessageMd = event.req._settings.ALT_SEARCH_KENDRA_FAQ_MESSAGE == '' ? '' : `*${event.req._settings.ALT_SEARCH_KENDRA_FAQ_MESSAGE}* \n`;
    const minimumScore = event.req._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE;
    const useFullMessageForSpeech = _.get(event.req, '_settings.ALT_SEARCH_KENDRA_ABBREVIATE_MESSAGE_FOR_SSML', 'true').toString().toUpperCase() === 'FALSE';
    let speechMessage = '';
    const maxDocumentCount = _.get(event.req, '_settings.ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT', 2);
    let seenTop = false;
    const searchTypes = _.get(event.req, '_settings.ALT_SEARCH_KENDRA_RESPONSE_TYPES', 'ANSWER,DOCUMENT,QUESTION_ANSWER').toUpperCase().split(',');
    let foundAnswerCount = 0;
    let foundDocumentCount = 0;
    let kendraQueryId;
    let kendraIndexId;
    let kendraResultId;
    let answerDocumentUris = new Set();
    const helpfulDocumentsUris = new Set();

    const debugResults = [];
    const allFilteredMessages = [];

    const filteredElements = getResultItems(resArray, minimumScore, searchTypes);

    filteredElements.forEach((element) => {
        if (returnTopAnswer && seenTop) {
            return;
        }

        /* Note - only the first answer will be provided back to the requester */
        if (isAnswerType(element, foundAnswerCount)) {
            answerMessage += `\n\n ${element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, ' ')}`;
            allFilteredMessages.push(answerMessage);

            ({
                seenTop,
                answerMessageMd,
                answerMessage,
                speechMessage,
            } = getAnswerMsg(
                element,
                returnTopAnswer,
                seenTop,
                answerMessageMd,
                topAnswerMessageMd,
                answerMessage,
                topAnswerMessage,
                speechMessage,
            ));

            // Convert S3 Object URLs to signed URLs
            answerDocumentUris.add(element);
            kendraQueryId = element.QueryId; // store off the QueryId to use as a session attribute for feedback
            kendraIndexId = element.originalKendraIndexId; // store off the Kendra IndexId to use as a session attribute for feedback
            kendraResultId = element.Id; // store off resultId to use as a session attribute for feedback
            foundAnswerCount += 1;
            debugResults.push(create_debug_object(element));
        } else if (isQaType(element)) {
            // There will be 2 elements - [0] - QuestionText, [1] - AnswerText
            const message = element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, ' ');
            answerMessage = `${faqanswerMessage}\n\n ${message}`;
            allFilteredMessages.push(message);
            seenTop = true; // if the answer is in the FAQ, don't show document extracts
            answerDocumentUris = [];
            const answerTextMd = getAnswerTextMd(element);
            answerMessageMd = `${faqanswerMessageMd}\n\n${answerTextMd}`;

            kendraQueryId = element.QueryId; // store off the QueryId to use as a session attribute for feedback
            kendraIndexId = element.originalKendraIndexId; // store off the Kendra IndexId to use as a session attribute for feedback
            kendraResultId = element.Id; // store off resultId to use as a session attribute for feedback
            foundAnswerCount += 1;
            debugResults.push(create_debug_object(element));
        } else if (isDocType(element)) {
            let docInfo;
            ({ docInfo, speechMessage } = buildDocInfoAndSpeechMsg(seenTop, element, allFilteredMessages, foundAnswerCount, foundDocumentCount, speechMessage));
            helpfulDocumentsUris.add(docInfo);
            foundDocumentCount += 1;
            debugResults.push(create_debug_object(element));
        }
    });

    // update QnABot answer content for ssml, markdown, and text
    const ssmlMessage = getSsmlMessage(foundAnswerCount, foundDocumentCount, answerMessage, speechMessage, useFullMessageForSpeech, allFilteredMessages);
    const [message, markdown] = getMarkdownMessage(answerMessageMd, answerMessage, event, answerDocumentUris, foundAnswerCount, seenTop, helpfulDocumentsUris, maxDocumentCount);

    const hit = create_hit(message, markdown, ssmlMessage, foundAnswerCount + foundDocumentCount, debugResults, {
        kendraQueryId,
        kendraIndexId,
        kendraResultId,
        kendraFoundAnswerCount: foundAnswerCount,
        kendraFoundDocumentCount: foundDocumentCount,
        maxDocuments: maxDocumentCount,
    });

    if (hit) {
        hit.autotranslate = !useOriginalLanguageQuery;
    }
    qnabot.debug('Kendra Fallback result: ', JSON.stringify(hit, null, 2));
    return hit;
}
