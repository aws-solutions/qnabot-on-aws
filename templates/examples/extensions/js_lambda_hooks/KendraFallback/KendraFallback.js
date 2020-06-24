/**
 * optional environment variables - These are not used defined during setup of this function in QnABot but are
 * useful for testing if defined.
 *
 * REGION - optional AWS region to target
 * KENDRA_INDEX - optional string defining index to query
 *
 */

const AWSKendra = require('aws-sdk/clients/kendra');
let kendraIndexes = undefined;

/**
 * Function to query kendraClient and return results via Promise
 * @param kendraClient
 * @param params
 * @param resArray
 * @returns {*}
 */
function kendraRequester(kendraClient,params,resArray) {
    return new Promise(function(resolve, reject) {
        kendraClient.query(params, function(err, data) {
            let indexId = params.IndexId;
            if (err) {
                console.log(err, err.stack);
                reject('Error from Kendra query request:' + err);
            }
            else {
                data.originalKendraIndexId = indexId;
                console.log("Data from Kendra request:" + JSON.stringify(data, null, 2));
                resArray.push(data);
                resolve(data);
            }
        });
    });
}

/** Function that processes kendra requests and handles response. Decides whether to handle SNS
 * events or Lambda Hook events from QnABot.
 * @param event - input event passed to the Lambda Handler
 * @param context - input context passed to the Lambda Handler
 * @returns {Promise<*>} - returns the response in event.res
 */
async function routeKendraRequest(event, context) {

    // remove any prior session attributes for kendra
    if (event && event.res && event.res.session.kendraQueryId) delete event.res.session.kendraQueryId;
    if (event && event.res && event.res.session.kendraIndexId) delete event.res.session.kendraIndexId;
    if (event && event.res && event.res.session.kendraResultId) delete event.res.session.kendraResultId;
    if (event && event.res && event.res.session.kendraResponsibleQid) delete event.res.session.kendraResponsibleQid;
    

    let promises = [];
    let resArray = [];
    let kendraClient = undefined;
    // if test environment, then use mock-up of kendraClient
    if (event.test) {
        kendraClient = require('./test/mockClient.js');
    } else if (event.test2) {
        kendraClient = require('./test/mockClient2.js');
    } else {
        kendraClient = (process.env.REGION ?
            new AWSKendra({apiVersion: '2019-02-03', region: process.env.REGION}) :
            new AWSKendra({apiVersion: '2019-02-03'})
        );
    }

    // process query against Kendra for QnABot
    let indexes = event.req["_settings"]["ALT_SEARCH_KENDRA_INDEXES"] ? event.req["_settings"]["ALT_SEARCH_KENDRA_INDEXES"] : process.env.KENDRA_INDEXES
    if (indexes && indexes.length) {
        try {
            kendraIndexes = JSON.parse(indexes);
        } catch (err) {
            console.warn('kendra indexes could not be parsed');
        }
    }
    if (kendraIndexes === undefined) {
        throw new Error('Undefined Kendra Indexe');
    }

    // This function can handle configuration with an array of kendraIndexes.
    // Iterate through this area and perform queries against Kendra.
    kendraIndexes.forEach(function (index, i) {
        const params = {
            IndexId: index, /* required */
            QueryText: event.req["_event"].inputTranscript, /* required */
        };
        let p = kendraRequester(kendraClient,params,resArray);
        promises.push(p);
    });

    // wait for all kendra queries to complete
    await Promise.all(promises);

    // process kendra query responses and update answer content

    /* default message text - can be overridden using QnABot SSM Parameter Store Custom Property */
    let answerMessage = 'While I did not find an exact answer, these search results from Amazon Kendra might be helpful. ';
    let answerMessageMd = '*While I did not find an exact answer, these search results from Amazon Kendra might be helpful.* \n ';
    let faqanswerMessage = 'Answer from Amazon Kendra FAQ.';
    let faqanswerMessageMd = '*Answer from Amazon Kendra FAQ.* \n ';
    let markdownAnswer = "";
    let helpfulLinksMsg = 'Possible Links';
    let extractedTextMsg = 'Discovered Text';
    let maxDocumentCount = 4;

    let foundAnswerCount = 0;
    let foundDocumentCount = 0;
    let kendraQueryId;
    let kendraIndexId;
    let kendraResultId;
    let answerDocumentUris = new Set();
    let helpfulDocumentsUris = new Set();
    
    resArray.forEach(function (res) {
        if (res && res.ResultItems.length > 0) {
            helpfulLinksMsg = event.req["_settings"]["ALT_SEARCH_HELPFUL_LINKS_MSG"] ? event.req["_settings"]["ALT_SEARCH_HELPFUL_LINKS_MSG"] : helpfulLinksMsg;
            extractedTextMsg = event.req["_settings"]["ALT_SEARCH_EXTRACTED_TEXT_MSG"] ? event.req["_settings"]["ALT_SEARCH_EXTRACTED_TEXT_MSG"] : extractedTextMsg;
            maxDocumentCount = event.req["_settings"]["ALT_SEARCH_MAX_DOCUMENT_COUNT"] ? event.req["_settings"]["ALT_SEARCH_MAX_DOCUMENT_COUNT"] : maxDocumentCount;
            answerMessage = event.req["_settings"]["ALT_SEARCH_MESSAGE"] ? event.req["_settings"]["ALT_SEARCH_MESSAGE"] : answerMessage;
            answerMessageMd = event.req["_settings"]["ALT_SEARCH_MESSAGE_MD"] ? event.req["_settings"]["ALT_SEARCH_MESSAGE_MD"] : answerMessageMd;
            
            res.ResultItems.forEach(function (element, i) {
                /* Note - only the first answer will be provided back to the requester */
                if (element.Type === 'ANSWER' && foundAnswerCount === 0 && element.AdditionalAttributes &&
                    element.AdditionalAttributes.length > 0 &&
                    element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text) {
                    answerMessage += '\n\n ' + element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, " ");
                    let answerTextMd = element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, " ");
                    // iterates over the answer highlights, finds top answer if it exists
                    var elem;
                    var seenTop = false;
                    let len = element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Highlights.length;
                    var j;
                    for (j=0; j<len; j++) {
                        elem = element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Highlights[j];
                        let offset = 2*j;
                        let beginning = answerTextMd.substring(0, elem.BeginOffset+offset);
                        let highlight = answerTextMd.substring(elem.BeginOffset+offset, elem.EndOffset+offset);
                        let rest = answerTextMd.substr(elem.EndOffset+offset);
                        
                        if (elem.TopAnswer == true) {
                            seenTop = true;
                            answerMessage = 'Answer from Amazon Kendra: ' + highlight;
                            answerTextMd = '*' + highlight + '* ';
                            break;
                        } else {
                            answerTextMd = beginning + '*' + highlight + '*' + rest;
                        }
                    };
                    answerMessageMd = faqanswerMessageMd + '\n\n' + answerTextMd;
                    // answerMessageMd += '\n\n' + element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, " ");
                    answerDocumentUris.add(element.DocumentURI);
                    kendraQueryId = res.QueryId; // store off the QueryId to use as a session attribute for feedback
                    kendraIndexId = res.originalKendraIndexId; // store off the Kendra IndexId to use as a session attribute for feedback
                    kendraResultId = element.Id; // store off resultId to use as a session attribute for feedback
                    foundAnswerCount++;
                } else if (element.Type === 'QUESTION_ANSWER' && foundAnswerCount === 0 && element.AdditionalAttributes &&
                    element.AdditionalAttributes.length > 1) {
                    // There will be 2 elements - [0] - QuestionText, [1] - AnswerText
                    answerMessage = faqanswerMessage + '\n\n ' + element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, " ");
                    let answerTextMd = element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, " ");
                    // iterates over the FAQ highlights
                    var elem;
                    var seenTop = false;
                    let len = element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Highlights.length;
                    var j;
                    for (j=0; j<len; j++) {
                        elem = element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Highlights[j];
                        let offset = 2*j;
                        let beginning = answerTextMd.substring(0, elem.BeginOffset+offset);
                        let highlight = answerTextMd.substring(elem.BeginOffset+offset, elem.EndOffset+offset);
                        let rest = answerTextMd.substr(elem.EndOffset+offset);
                        answerTextMd = beginning + '*' + highlight + '*' + rest;
                    };
                    answerMessageMd = faqanswerMessageMd + '\n\n' + answerTextMd;
                    kendraQueryId = res.QueryId; // store off the QueryId to use as a session attribute for feedback
                    kendraIndexId = res.originalKendraIndexId; // store off the Kendra IndexId to use as a session attribute for feedback
                    kendraResultId = element.Id; // store off resultId to use as a session attribute for feedback
                    foundAnswerCount++;
                } else if (element.Type === 'DOCUMENT' && element.DocumentExcerpt.Text && element.DocumentURI) {
                    const docInfo = {}
                    docInfo.text = element.DocumentExcerpt.Text.replace(/\r?\n|\r/g, " ");
                    // iterates over the document excerpt highlights
                    var elem;
                    let len = element.DocumentExcerpt.Highlights.length;
                    var j;
                    for (j=0; j<len; j++) {
                        elem = element.DocumentExcerpt.Highlights[j];
                        let offset = 2*j;
                        let beginning = docInfo.text.substring(0, elem.BeginOffset+offset);
                        let highlight = docInfo.text.substring(elem.BeginOffset+offset, elem.EndOffset+offset);
                        let rest = docInfo.text.substr(elem.EndOffset+offset);
                        docInfo.text = beginning + '*' + highlight + '*' + rest;
                    };

                    docInfo.uri = element.DocumentURI;
                    helpfulDocumentsUris.add(docInfo);
                    foundAnswerCount++;
                    foundDocumentCount++;
                }
            });
        }
    });

    // update QnABot answer content for ssml, markdown, and text
    if (foundAnswerCount > 0) {
        event.res.message = answerMessage;
        let ssmlMessage = `${answerMessage.substring(0,600).replace(/\r?\n|\r/g, " ")}`;
        let lastIndex = ssmlMessage.lastIndexOf('.');
        if (lastIndex > 0) {
            ssmlMessage = ssmlMessage.substring(0,lastIndex);
        }
        ssmlMessage = `<speak> ${ssmlMessage} </speak>`;
        event.res.session.appContext.altMessages.markdown = answerMessageMd;
        event.res.session.appContext.altMessages.ssml = ssmlMessage;
        if (event.req["_event"].outputDialogMode !== 'Text') {
            event.res.message = ssmlMessage;
            event.res.type = 'SSML';
            event.res.plainMessage = answerMessage;
        }
    }
    if (answerDocumentUris.size > 0) {
        event.res.session.appContext.altMessages.markdown += `\n\n #### ${helpfulLinksMsg}`;
        answerDocumentUris.forEach(function (element) {
            event.res.session.appContext.altMessages.markdown += `\n\n [${element}](${element})`;
        });
    }

    let idx=0;
    helpfulDocumentsUris.forEach(function (element) {
        if (idx++ < maxDocumentCount) {
            if (element.text && element.text.length > 0) {
                event.res.session.appContext.altMessages.markdown += `\n\n #### ${extractedTextMsg} \n\n ${element.text}`
            }
            event.res.session.appContext.altMessages.markdown += `\n\n [${element.uri}](${element.uri})`;
        }
    });

    if (kendraQueryId) {
        event.res.session.kendraResponsibleQid = event.res.result.qid;
        event.res.session.kendraQueryId = kendraQueryId;
        event.res.session.kendraIndexId = kendraIndexId;
        event.res.session.kendraResultId = kendraResultId;
    }
    console.log("final return: " + JSON.stringify(event,null,2));
    return event;
}

exports.handler = async (event, context) => {
    console.log("event: " + JSON.stringify(event, null, 2));
    console.log('context: ' + JSON.stringify(context, null, 2));
    return routeKendraRequest(event, context);
};
