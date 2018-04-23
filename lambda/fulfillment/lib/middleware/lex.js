var _=require('lodash')
exports.parse=function(event){
    return {
        _type:"LEX",
        question:_.get(event,'inputTranscript'),
        session:_.get(event,'sessionAttributes',{}) || {},
        channel:_.get(event,"requestAttributes.'x-amz-lex:channel-type'")
    }
}
exports.assemble=function(request,response){
    var out={
        sessionAttributes:_.mapValues(
            _.get(response,'session',{}),
            x=>_.isString(x) ? x : JSON.stringify(x)
        ),
        dialogAction:_.pickBy({
            type:"Close",
            fulfillmentState:"Fulfilled",
            message:{
                contentType:response.type,
                content:response.message
            },
            responseCard:isCard(response.card) ? {
                version:"1",
                contentType:"application/vnd.amazonaws.card.generic",
                genericAttachments:[{
                    title:response.card.title,
                    subTitle:_.get(response.card,'subTitle',undefined),
                    imageUrl:response.card.imageUrl
                }, _.negate(_.isUndefined)]
            } : null
        })
    }
    console.log(response.card)
    if(isCard(response.card)){
        out.sessionAttributes.appContext=JSON.stringify({
            responseCard:out.dialogAction.responseCard
        })
    }else{
        delete out.sessionAttributes.appContext
    }
    console.log("Lex response:",JSON.stringify(out,null,2))
    return out
}

function isCard(card){
    return card.send 
}
