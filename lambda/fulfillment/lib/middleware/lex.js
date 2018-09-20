var _=require('lodash')
exports.parse=function(event){
    return {
        _type:"LEX",
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
            responseCard:isCard(response.card) && (_.get(response.card,"imageUrl").trim() || filteredButtons.length > 0) ? {
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
    
    if(isCard(response.card)){
        var tmp=JSON.parse(_.get(response,"session.appContext","{}"))
        tmp.responseCard=out.dialogAction.responseCard
        response.session.appContext=JSON.stringify(tmp)
    }

    console.log("Lex response:",JSON.stringify(out,null,2))
    return out
}

function isCard(card){
    return _.get(card,"send")
}
