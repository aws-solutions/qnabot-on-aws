var _=require('lodash')

// When using QnABot in Amazon Connect call center, filter out 'filler' words that callers sometimes use
// filler words are defined in setting CONNECT_IGNORE_WORDS
// If inPutTranscript contains only filler words, return true.
function isConnectClient(req) {
    if (_.get(req,"_event.requestAttributes.x-amz-lex:accept-content-types", undefined) === undefined) {
        return false;
    }
    return true;
}
function trapIgnoreWords(req, transcript) {
    const ignoreWordsArr = _.get(req, '_settings.CONNECT_IGNORE_WORDS', "").split(',');
    if (ignoreWordsArr.length === 0 || !isConnectClient(req)) {
        return false;
    }
    const wordsInTranscript = transcript.split(' ');
    let trs = "";
    const wordCount = wordsInTranscript.length;
    for (let i = 0; i < wordCount; i++) {
        if (!ignoreWordsArr.includes(wordsInTranscript[i])) {
            if (trs.length > 0) trs += ' ';
            trs += wordsInTranscript[i];
        }
    }
    if (trs.trim().length === 0) {
        return true;
    } else {
        return false;
    }
}

exports.parse=async function(req){
    var event = req._event;
    if (event.inputTranscript === undefined || event.inputTranscript === "") {
        // trap invalid input from Lex and and return an error if there is no inputTranscript.
        throw new Error("Error - inputTranscript string is empty.");
    } else if (trapIgnoreWords(req, event.inputTranscript)) {
        throw new Error(`Error - inputTranscript contains only words specified in setting CONNECT_IGNORE_WORDS: "${event.inputTranscript}"`);
    } else {
        var out = {
            _type: "LEX",
            _userId: _.get(event, "userId", "Unknown Lex User"),
            question: _.get(event, 'inputTranscript'),
            session: _.mapValues(
                _.get(event, 'sessionAttributes', {}),
                x => {
                    try {
                        return JSON.parse(x)
                    } catch (e) {
                        return x
                    }
                }
            ),
            channel: _.get(event, "requestAttributes.'x-amz-lex:channel-type'")
        }
        return out;
    }
}

exports.assemble=function(request,response){
    var filteredButtons = _.get(response.card,"buttons",[])
    for (var i = filteredButtons.length - 1; i >= 0; --i){
        if (!(filteredButtons[i].text && filteredButtons[i].value)){
            filteredButtons.splice(i,1)
        }
    }
    var out={
        sessionAttributes:_.get(response,'session',{}),
        dialogAction:_.pickBy({
            type:"Close",
            fulfillmentState:"Fulfilled",
            message:{
                contentType:response.type,
                content:response.message
            },
            responseCard:isCard(response.card) && (_.get(response.card,"imageUrl","").trim() || filteredButtons.length > 0) ? {
                version:"1",
                contentType:"application/vnd.amazonaws.card.generic",
                genericAttachments:[_.pickBy({
                    title:_.get(response,"card.title","Image"),
                    subTitle:_.get(response.card,'subTitle'),
                    imageUrl:response.card.imageUrl,
                    buttons: _.has(filteredButtons, [0]) ? filteredButtons : null
                })]
            } : null
        })
    } ;
    
    // If client is slack, use Markdown in response
    if (request._clientType == "LEX.Slack.Text") {
        if (_.get(response,"result.alt.markdown")) {
            out.dialogAction.message.content = response.result.alt.markdown ;
        }
    }
    
    // copy response card to appContext session attribute used by lex-web-ui
    //  - allows repsonse card display even when using postContent (voice) with Lex (not otherwise supported by Lex)
    //  - allows Lex limit of 5 buttons to be exceeded when using lex-web-ui
    if(isCard(response.card)){
        var tmp
        try {
            tmp=JSON.parse(_.get(response,"session.appContext","{}"));
        } catch(e) {
            tmp=_.get(response,"session.appContext","{}");
        }
        tmp.responseCard=out.dialogAction.responseCard;
        response.session.appContext=JSON.stringify(tmp);
    }
 
    // Lex has limit of max 5 buttons in the responsecard.. if we have more than 5, use the first 5 only.
    // note when using lex-web-ui, this limitation is circumvented by use of the appContext session attribute above.
    var buttons = _.get(out,"dialogAction.responseCard.genericAttachments[0].buttons");
    if (buttons && buttons.length > 5) {
        console.log("WARNING: Truncating button list to contain only first 5 buttons to adhere to Lex limits.");
        _.set(out,"dialogAction.responseCard.genericAttachments[0].buttons",buttons.slice(0,5));
    }
    
    console.log("Lex response:",JSON.stringify(out,null,2))
    return out
}

function isCard(card){
    return _.get(card,"send")
}
