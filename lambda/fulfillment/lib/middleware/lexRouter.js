/**
 *
 * Lex Bot Router. Given the name of a bot, Call bot using $LATEST and pass input text.
 * Handle response from Lex Bot and update session attributes as needed.
 */
const _=require('lodash');
const AWS = require('aws-sdk');

/**
 * Call postText and use promise to return data response.
 * @param lexClient
 * @param params
 * @returns {*}
 */
function lexClientRequester(lexClient,params) {
    return new Promise(function(resolve, reject) {
        lexClient.postText(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                reject('Lex client request error:' + err);
            }
            else {
                console.log("Lex client response:" + JSON.stringify(data, null, 2));
                resolve(data);
            }
        });
    });
}

/**
 * Setup call to Lex including user ID, input text, botName, botAlis. It is an async function and
 * will return the response form Lex.
 * @param req
 * @param res
 * @param botName
 * @param botAlias
 * @returns {Promise<*>}
 */
async function handleRequest(req, res, botName, botAlias) {
    let tempBotUserID = _.get(req,"_event.userId");
    tempBotUserID = tempBotUserID ? tempBotUserID : _.get(res,"session.sessionId");
    tempBotUserID = tempBotUserID ? tempBotUserID : Math.floor(Date.now() * 1000).toString();
    const lexClient = new AWS.LexRuntime({apiVersion: '2016-11-28'});
    const params = {
        botAlias: botAlias,
        botName: botName,
        inputText: _.get(req,"question"),
        userId: tempBotUserID
    };

    const response = await lexClientRequester(lexClient,params);
    return response;
};

/**
 * Main processing logic to handle request from 3_query.js and process response from Lex. Handles
 * dialogState response from Lex.
 * @param req
 * @param res
 * @param hook
 * @returns {Promise<{}>}
 */
async function processResponse(req, res, hook, msg) {

    function indicateFailure(req, res, errmsg) {
        res.message = errmsg;
        res.plainMessage = errmsg;
        _.set(res.session,res.session.elicitResponseNamespace + '.boterror','true');
        res.session.elicitResponseProgress = 'Failed';
        res.session.elicitResponse = undefined;
        res.session.elicitResponseChainingConfig = undefined;
        res.session.elicitResponseNamespace = undefined;
        res.session.elicitResponseLoopCount = 0;
        res.card = undefined;
    }

    const maxElicitResponseLoopCount = _.get(req, '_settings.ELICIT_RESPONSE_MAX_RETRIES', 5);
    const elicit_Response_Retry_Message = _.get(req, '_settings.ELICIT_RESPONSE_RETRY_MESSAGE', "Please try again?");

    let botResp = await handleRequest(req, res, hook, "$LATEST");
    console.log("botResp: " + JSON.stringify(botResp,null,2));
    let elicitResponseLoopCount =_.get(res,"session.elicitResponseLoopCount");
    if (botResp.dialogState === 'ConfirmIntent') {
        res.session.elicitResponseProgress = 'ConfirmIntent';
        if (botResp.message) {
            res.message = botResp.message;
            res.plainMessage = botResp.message;
        } else {
            res.message = undefined;
            res.plainMessage = undefined;
        }
        res.card = {
            "send": true,
            "title": "Info",
            "text": "",
            "url": "",
            "subTitle": "",
            "imageUrl": "",
            "buttons": [
                {
                    "text": "Yes",
                    "value": "Yes"
                },
                {
                    "text": "No",
                    "value": "No"
                }
            ]
        };
    } else if (botResp.dialogState === 'Failed') {
        res.session.elicitResponseLoopCount = ++elicitResponseLoopCount;
        if (elicitResponseLoopCount >= maxElicitResponseLoopCount) {
            indicateFailure(req, res, _.get(req, '_settings.ELICIT_RESPONSE_BOT_FAILURE_MESSAGE', 'Your response was not understood. Please start again.'));
        } else {
            res.session.elicitResponseProgress = botResp.dialogState;
            res.message = elicit_Response_Retry_Message;
            res.plainMessage = elicit_Response_Retry_Message;
            res.card = undefined;
        }
    } else if (botResp.dialogState === 'ElicitIntent' || botResp.dialogState === 'ElicitSlot') {
        res.session.elicitResponseProgress = botResp.dialogState;
        if (botResp.message) {
            res.message = botResp.message;
            res.plainMessage = botResp.message;
        } else {
            res.message = elicit_Response_Retry_Message;
            res.plainMessage = elicit_Response_Retry_Message;
        }
        res.card = undefined;
    } else if (botResp.dialogState === 'Fulfilled' || botResp.dialogState === 'ReadyForFulfillment') {
        if (botResp.message) {
            res.message = botResp.message;
            res.plainMessage = botResp.message;
        } else {
            res.message = undefined;
            res.plainMessage = undefined;
        }
        res.session.elicitResponseProgress = botResp.dialogState;
        _.set(res.session,res.session.elicitResponseNamespace,botResp.slots);
        res.session.elicitResponse = undefined;
        res.session.elicitResponseNamespace = undefined;
    } else {
        if (botResp.message) {
            res.message = botResp.message;
            res.plainMessage = botResp.message;
        } else {
            res.message = elicit_Response_Retry_Message;
            res.plainMessage = elicit_Response_Retry_Message;
        }
        res.session.elicitResponseProgress = botResp.dialogState;
    }

    // as much as we'd like to return an empty message, QnABot semantics requires some message to
    // be returned.
    res.message = res.message ? res.message : _.get(req, '_settings.ELICIT_RESPONSE_DEFAULT_MSG', 'Ok. ');
    res.plainMessage = res.plainMessage ? res.plainMessage : _.get(req, '_settings.ELICIT_RESPONSE_DEFAULT_MSG', 'Ok. ');

    const resp = {};
    resp.req = req;
    resp.res = res;
    return resp;
}

exports.elicitResponse=processResponse;