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
  intervals.sort(function(a, b) {return (a[1]-a[0]) - (b[1]-b[0])});
  return intervals[0];

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
    } else if (event.test3) {
        kendraClient = require('./test/mockClient3.js');
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
        throw new Error('Undefined Kendra Indexes');
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
    let topAnswerMessage = "Amazon Kendra suggested answer. \n\n ";
    let topAnswerMessageMd = "*Amazon Kendra suggested answer.* \n ";
    let answerMessage = 'While I did not find an exact answer, these search results from Amazon Kendra might be helpful. ';
    let answerMessageMd = '*While I did not find an exact answer, these search results from Amazon Kendra might be helpful.* \n ';
    let faqanswerMessage = 'Answer from Amazon Kendra FAQ.';
    let faqanswerMessageMd = '*Answer from Amazon Kendra FAQ.* \n ';
    let markdownAnswer = "";
    let speechMessage = "";
    let helpfulLinksMsg = 'Source Link';
    let extractedTextMsg = 'Discovered Text';
    let moreResultsMsg = 'Additional Search Results';
    let maxDocumentCount = 2;
    var seenTop = false;

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
                    
                    // Emboldens the highlighted phrases returned by the Kendra response API in markdown format
                    let answerTextMd = element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, " ");
                    // iterates over the answer highlights in sorted order of BeginOffset, merges the overlapping intervals
                    var sorted_highlights = mergeIntervals(element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Highlights);
                    var j, elem;
                    for (j=0; j<sorted_highlights.length; j++) {
                        elem = sorted_highlights[j];
                        let offset = 4*j;
                        let beginning = answerTextMd.substring(0, elem.BeginOffset+offset);
                        let highlight = answerTextMd.substring(elem.BeginOffset+offset, elem.EndOffset+offset);
                        let rest = answerTextMd.substr(elem.EndOffset+offset);

                        if (elem.TopAnswer == true) {   // if top answer is found, then answer is abbreviated to this phrase
                            seenTop = true;
                            answerMessage = topAnswerMessage + highlight + '.';
                            answerMessageMd = topAnswerMessageMd;
                            answerTextMd = '**' + highlight + '** ';
                            break;
                        } else {
                            answerTextMd = beginning + '**' + highlight + '**' + rest;
                        }
                    };
                    answerMessageMd = answerMessageMd + '\n\n' + answerTextMd;
                    
                    // Shortens the speech response to contain say the longest highlighted phrase ONLY IF top answer not found
                    if (seenTop == false) {
                        var longest_highlight = longestInterval(sorted_highlights);
                        let answerText = element.AdditionalAttributes[0].Value.TextWithHighlightsValue.Text.replace(/\r?\n|\r/g, " ");
                        // speechMessage = answerText.substring(longest_highlight.BeginOffset, longest_highlight.EndOffset) + '.';

                        var pattern = new RegExp('[^.]* '+longest_highlight+'[^.]*\.[^.]*\.')
                        pattern.lastIndex = 0;  // must reset this property of regex object for searches
                        speechMessage = pattern.exec(answerText)[0]
                    }
                    
                    
                    answerDocumentUris.add(element.DocumentURI);
                    kendraQueryId = res.QueryId; // store off the QueryId to use as a session attribute for feedback
                    kendraIndexId = res.originalKendraIndexId; // store off the Kendra IndexId to use as a session attribute for feedback
                    kendraResultId = element.Id; // store off resultId to use as a session attribute for feedback
                    foundAnswerCount++;
                    
                    
                } else if (element.Type === 'QUESTION_ANSWER' && foundAnswerCount === 0 && element.AdditionalAttributes &&
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
                    
                } else if (element.Type === 'DOCUMENT' && element.DocumentExcerpt.Text && element.DocumentURI) {
                    const docInfo = {}
                    // if topAnswer found, then do not show document excerpts
                    if (seenTop == false) {
                        docInfo.text = element.DocumentExcerpt.Text.replace(/\r?\n|\r/g, " ");
                        // iterates over the document excerpt highlights in sorted order of BeginOffset, merges overlapping intervals
                        var sorted_highlights = mergeIntervals(element.DocumentExcerpt.Highlights);
                        var j, elem;
                        for (j=0; j<sorted_highlights.length; j++) {
                            elem = sorted_highlights[j];
                            let offset = 4*j;
                            let beginning = docInfo.text.substring(0, elem.BeginOffset+offset);
                            let highlight = docInfo.text.substring(elem.BeginOffset+offset, elem.EndOffset+offset);
                            let rest = docInfo.text.substr(elem.EndOffset+offset);
                            docInfo.text = beginning + '**' + highlight + '**' + rest;
                        };
                        
                        if (foundAnswerCount == 0 && foundDocumentCount == 0) {
                            speechMessage = element.DocumentExcerpt.Text.replace(/\r?\n|\r/g, " ");;
                            if (sorted_highlights.length > 0) {
                                var highlight = speechMessage.substring(sorted_highlights[0].BeginOffset, sorted_highlights[0].EndOffset)
                                var pattern = new RegExp('[^.]* '+highlight+'[^.]*\.[^.]*\.')
                                pattern.lastIndex = 0;  // must reset this property of regex object for searches
                                speechMessage = pattern.exec(speechMessage)[0]
                            }
                        }
                    }
                    // but even if topAnswer is found, show URL in markdown
                    docInfo.uri = element.DocumentURI;
                    helpfulDocumentsUris.add(docInfo);
                    // foundAnswerCount++;
                    foundDocumentCount++;
                }
            });
        }
    });

    // update QnABot answer content for ssml, markdown, and text
    if (foundAnswerCount > 0 || foundDocumentCount > 0) {
        event.res.message = answerMessage;
        let ssmlMessage = `${answerMessage.substring(0,600).replace(/\r?\n|\r/g, " ")}`;
        if (speechMessage != "") {
            ssmlMessage = `${speechMessage.substring(0,600).replace(/\r?\n|\r/g, " ")}`;
        }
        
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
        event.res.session.appContext.altMessages.markdown += `\n\n ${helpfulLinksMsg}: `;
        answerDocumentUris.forEach(function (element) {
            event.res.session.appContext.altMessages.markdown += `[${element}](${element})`;
        });
    }
    
    let idx=0;
    if (seenTop == false){
        helpfulDocumentsUris.forEach(function (element) {
            if (idx++ < maxDocumentCount) {
                event.res.session.appContext.altMessages.markdown += `\n\n`;
                event.res.session.appContext.altMessages.markdown += `***`;
                event.res.session.appContext.altMessages.markdown += `\n\n <br>`;
                
                if (element.text && element.text.length > 0) {
                    event.res.session.appContext.altMessages.markdown += `\n\n  ${element.text}`;
                }
                event.res.session.appContext.altMessages.markdown += `\n\n  ${helpfulLinksMsg}: [${element.uri}](${element.uri})`;
            }
        });
    }

    if (kendraQueryId) {
        event.res.session.kendraResponsibleQid = event.res.result.qid;
        event.res.session.kendraQueryId = kendraQueryId;
        event.res.session.kendraIndexId = kendraIndexId;
        event.res.session.kendraResultId = kendraResultId;
    }
    // console.log("final return: " + JSON.stringify(event,null,2));
    return event;
}

exports.handler = async (event, context) => {
    console.log("event: " + JSON.stringify(event, null, 2));
    console.log('context: ' + JSON.stringify(context, null, 2));
    return routeKendraRequest(event, context);
};
