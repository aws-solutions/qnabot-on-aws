/**
 * optional environment variables - These are not used defined during setup of this function in QnABot but are
 * useful for testing if defined.
 *
 * REGION - optional AWS region to target
 *
 */

const AWSKendra = require('aws-sdk/clients/kendra');
let kendraFaqIndex = undefined;

/**
 * Function to query kendraClient and return results via Promise
 * @param kendraClient
 * @param params
 * @param resArray
 * @returns {*}
 */
function kendraRequester(kendraClient,params) {
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
  if(intervals.length <= 1)
    return intervals;

  var stack = [];
  var top   = null;

  // sort the intervals based on their start values
  intervals.sort(function(a, b) {return a[0] - b[0]});

  // push the 1st interval into the stack
  stack.push(intervals[0]);

  // start from the next interval and merge if needed
  for (var i = 1; i < intervals.length; i++) {
    // get the top element
    top = stack[stack.length - 1];

    // if the current interval doesn't overlap with the 
    // stack top element, push it to the stack
    if (top.EndOffset < intervals[i].BeginOffset) {
      stack.push(intervals[i]);
    }
    // otherwise update the end value of the top element
    // if end of current interval is higher
    else if (top.EndOffset < intervals[i].EndOffset)
    {
      top.EndOffset = intervals[i].EndOffset;
      stack.pop();
      stack.push(top);
    }
  }

  return stack;
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
    

    var kendraClient = (process.env.REGION ?
            new AWSKendra({apiVersion: '2019-02-03', region: process.env.REGION}) :
            new AWSKendra({apiVersion: '2019-02-03'})
        );

    // process query against Kendra for QnABot
    kendraFaqIndex = process.env.KENDRA_FAQ_INDEX;
    if (kendraFaqIndex === undefined) {
        throw new Error('Undefined Kendra Index');
    }
    const params = {
        IndexId: kendraFaqIndex,
        QueryText: event.req["_event"].inputTranscript
    }
    var res = await Promise.all([kendraRequester(kendraClient, params)])

    // process kendra query responses and update answer content

    /* default message text - can be overridden using QnABot SSM Parameter Store Custom Property */
    let answerMessage = 'While I did not find an exact answer, these search results from Amazon Kendra might be helpful. ';
    let answerMessageMd = '*While I did not find an exact answer, these search results from Amazon Kendra might be helpful.* \n ';
    let faqanswerMessage = 'Answer from Amazon Kendra FAQ.';
    let faqanswerMessageMd = '*Answer from Amazon Kendra FAQ.* \n ';
    // let markdownAnswer = "";
    // let helpfulLinksMsg = 'Source Link';
    // let extractedTextMsg = 'Discovered Text';
    // let moreResultsMsg = 'Additional Search Results';
    let maxDocumentCount = 2;
    var seenTop = false;

    let foundAnswerCount = 0;
    // let foundDocumentCount = 0;
    let kendraQueryId;
    let kendraIndexId;
    let kendraResultId;
    // let answerDocumentUris = new Set();
    // let helpfulDocumentsUris = new Set();
    
    if (res && res.ResultItems.length > 0) {
        // helpfulLinksMsg = event.req["_settings"]["ALT_SEARCH_HELPFUL_LINKS_MSG"] ? event.req["_settings"]["ALT_SEARCH_HELPFUL_LINKS_MSG"] : helpfulLinksMsg;
        // extractedTextMsg = event.req["_settings"]["ALT_SEARCH_EXTRACTED_TEXT_MSG"] ? event.req["_settings"]["ALT_SEARCH_EXTRACTED_TEXT_MSG"] : extractedTextMsg;
        maxDocumentCount = event.req["_settings"]["ALT_SEARCH_MAX_DOCUMENT_COUNT"] ? event.req["_settings"]["ALT_SEARCH_MAX_DOCUMENT_COUNT"] : maxDocumentCount;
        // answerMessage = event.req["_settings"]["ALT_SEARCH_MESSAGE"] ? event.req["_settings"]["ALT_SEARCH_MESSAGE"] : answerMessage;
        // answerMessageMd = event.req["_settings"]["ALT_SEARCH_MESSAGE_MD"] ? event.req["_settings"]["ALT_SEARCH_MESSAGE_MD"] : answerMessageMd;
        
        res.ResultItems.forEach(function (element, i) {
            /* Note - only FAQ format will be provided back to the requester */
            if (element.Type === 'QUESTION_ANSWER' && foundAnswerCount === 0 && element.AdditionalAttributes &&
                element.AdditionalAttributes.length > 1) {
                // There will be 2 elements - [0] - QuestionText, [1] - AnswerText
                answerMessage = faqanswerMessage + '\n\n ' + element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, " ");
                
                seenTop = true; // if the answer is in the FAQ, don't show document extracts
                let answerTextMd = element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, " ");
                // iterates over the FAQ answer highlights in sorted order of BeginOffset, merges the overlapping intervals
                var sorted_highlights = mergeIntervals(element.AdditionalAttributes[1].Value.TextWithHighlightsValue.Highlights);
                var j, elem;
                for (j=0; j<sorted_highlights.length; j++) {
                    elem = sorted_highlights[j];
                    let offset = 4*j;
                    let beginning = answerTextMd.substring(0, elem.BeginOffset+offset);
                    let highlight = answerTextMd.substring(elem.BeginOffset+offset, elem.EndOffset+offset);
                    let rest = answerTextMd.substr(elem.EndOffset+offset);
                    answerTextMd = beginning + '**' + highlight + '**' + rest;
                };
                answerMessageMd = faqanswerMessageMd + '\n\n' + answerTextMd;
                
                kendraQueryId = res.QueryId; // store off the QueryId to use as a session attribute for feedback
                kendraIndexId = res.originalKendraIndexId; // store off the Kendra IndexId to use as a session attribute for feedback
                kendraResultId = element.Id; // store off resultId to use as a session attribute for feedback
                foundAnswerCount++;
                
                // TODO: use json structure for query response from doc URL field
                // var json_struct = JSON.parse(element.DocumentURI);
                
            }
        });
    }

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
    // if (answerDocumentUris.size > 0) {
    //     event.res.session.appContext.altMessages.markdown += `\n\n ${helpfulLinksMsg}: `;
    //     answerDocumentUris.forEach(function (element) {
    //         event.res.session.appContext.altMessages.markdown += `[${element}](${element})`;
    //     });
    // }
    
    // let idx=0;
    // if (seenTop == false){
    //     helpfulDocumentsUris.forEach(function (element) {
    //         if (idx++ < maxDocumentCount) {
    //             event.res.session.appContext.altMessages.markdown += `\n\n`;
    //             event.res.session.appContext.altMessages.markdown += `***`;
    //             event.res.session.appContext.altMessages.markdown += `\n\n <br>`;
                
    //             if (element.text && element.text.length > 0) {
    //                 event.res.session.appContext.altMessages.markdown += `\n\n  ${element.text}`;
    //             }
    //             event.res.session.appContext.altMessages.markdown += `\n\n  ${helpfulLinksMsg}: [${element.uri}](${element.uri})`;
    //         }
    //     });
    // }

    if (kendraQueryId) {
        event.res.session.kendraResponsibleQid = event.res.result.qid;
        event.res.session.kendraQueryId = kendraQueryId;
        event.res.session.kendraIndexId = kendraIndexId;
        event.res.session.kendraResultId = kendraResultId;
    }
    console.log("RETURN: " + JSON.stringify(event,null,2));
    return event;
}

exports.handler = async (event, context) => {
    console.log("event: " + JSON.stringify(event, null, 2));
    console.log('context: ' + JSON.stringify(context, null, 2));
    return routeKendraRequest(event, context);
};
