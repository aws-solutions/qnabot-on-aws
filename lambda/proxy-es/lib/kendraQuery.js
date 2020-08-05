/**
 * optional environment variables - These are not used defined during setup of this function in QnABot but are
 * useful for testing if defined.
 *
 * REGION - optional AWS region to target
 *
 */

// const AWSKendra = require('aws-sdk/clients/kendra');
const AWS = require('aws-sdk');

// AWS.sdk.config.update({
//   maxRetries: 6, // default 3
//   retryDelayOptions: {
//     base: 300, // default 100
//   },
// });

// let kendraFaqIndex = undefined;

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
                // TODO: undo
                // console.log("Data from Kendra request:" + JSON.stringify(data, null, 2));
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
 * @param request - request parameters object
//  * @param event - input event passed to the Lambda Handler
//  * @param context - input context passed to the Lambda Handler
 * @returns {Promise<*>} - returns the response in event.res
 */
async function routeKendraRequest(request_params) {

    var kendraClient = (process.env.REGION ?
            new AWS.Kendra({apiVersion: '2019-02-03', region: process.env.REGION}) :
            new AWS.Kendra({apiVersion: '2019-02-03', region: 'us-east-1'})  // TODO: delete region here, for testing purposes only
        );
        
    
    let promises = [];
    let resArray = [];
    let kendraIndexes = undefined;
    let kendraFaqIndex = request_params.kendra_faq_index;
    if (kendraFaqIndex != "" && kendraFaqIndex != undefined) {
        kendraIndexes = [kendraFaqIndex];
    } else {
        throw new Error("Undefined KendraFAQIndex: " + kendraFaqIndex);
    }
    // Iterate through this area and perform queries against Kendra.
    kendraIndexes.forEach(function (index, i) {
        const params = {
            IndexId: index, /* required */
            QueryText: request_params.input_transcript
        };
        let p = kendraRequester(kendraClient,params,resArray);
        promises.push(p);
    });
    await Promise.all(promises);


    // ----- process kendra query responses and update answer content -----

    /* default message text - can be overridden using QnABot SSM Parameter Store Custom Property */
    let maxDocumentCount = 2;
    let foundAnswerCount = 0;
    let kendraQueryId;
    let kendraIndexId;
    let kendraResultId;
    let json_struct = [];
    let scores = [];
    
    
    // note that this outside for loop will only execute once (one FAQ index) but the structure was kept due to its elegance
    resArray.forEach(function (res) {
        if (res && res.ResultItems.length > 0) {
            maxDocumentCount = request_params.max_doc_count ? request_params.max_doc_count : maxDocumentCount;  // TODO: configure by user? or expandable bubble?
            
            var i, element;
            for (i=0; i<res.ResultItems.length; i++) {
                element = res.ResultItems[i];
                /* Note - only FAQ format will be provided back to the requester */
                if (element.Type === 'QUESTION_ANSWER' && foundAnswerCount === 0 && element.AdditionalAttributes &&
                    element.AdditionalAttributes.length > 1) {

                    if (!hasJsonStructure(element.DocumentURI)) {
                        break;
                    }
                    var hit = JSON.parse(element.DocumentURI);
                    // TODO: undo
                    // console.log(`hit is ${JSON.stringify(hit)}`);
                    json_struct.push(hit);

                    kendraQueryId = res.QueryId; // store off the QueryId to use as a session attribute for feedback
                    kendraIndexId = res.originalKendraIndexId; // store off the Kendra IndexId to use as a session attribute for feedback
                    kendraResultId = element.Id; // store off resultId to use as a session attribute for feedback
                    foundAnswerCount++;
                }
            };
        }
    });
    
    // return query response structure to make Kendra results look like ES results so we don't have to change the UI
    var hits_struct = {
        // "took": 104,
        "timed_out": false,
        "hits": {
            "total": {
                "value": foundAnswerCount,  // if no answers found, total hits # is 0 and hits list is empty
                "relation": "eq"
            },
            "max_score": json_struct.length,
            "hits": [],
        },
        // TODO: in event.res.session add kendra query id, kendra index id, kendra result id
        "kendraQueryId":kendraQueryId,
        "kendraIndexId":kendraIndexId,
        "kendraResultId":kendraResultId
    }

    
    let ans = {};
    var j, faq_struct;
    var num=json_struct.length;
    if (request_params.size) {
        num = Math.min(num, request_params.size);
    }
    for (j=0; j<num; j++) {
        faq_struct = json_struct[j];
        
        ans = {
            "_index": request_params.kendra_faq_index,
            "_type": "_faq",
            "_id": faq_struct.qid,
            "_score": json_struct.length-j, // score is inverse ranking of returned results
            "_source": faq_struct
        }
        hits_struct.hits.hits.push(ans);
    }
    
    // TODO: undo
    // console.log("RETURN: " + JSON.stringify(hits_struct));
    return hits_struct;
}

exports.handler = async (request_params) => {
    // TODO: undo
    // console.log("kendra query request: " + JSON.stringify(request_params));
    return routeKendraRequest(request_params);
};
