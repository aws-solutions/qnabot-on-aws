var _=require('lodash')
exports.parse=async function(req){
    var event = req._event;
    var out={
        _type:"LEX",
        _userId:_.get(event,"userId","Unknown Lex User"),
        question:_.get(event,'inputTranscript'),
        session:_.mapValues(
            _.get(event,'sessionAttributes',{}),
            x=>{
                try {
                    return JSON.parse(x)
                } catch(e){
                    return x
                }
            }
        ),
        channel:_.get(event,"requestAttributes.'x-amz-lex:channel-type'")
    }
    return out;
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
