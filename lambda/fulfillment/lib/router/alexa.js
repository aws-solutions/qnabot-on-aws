var _=require('lodash')
exports.parse=function(event){
    var out={
        _type:"ALEXA",
        original:event,
        session:_.get(event,'session.attributes',{}) || {},
        channel:null,
    }

    switch(_.get(event,"request.type")){
        case "LaunchRequest":
            throw new Respond({
                version:'1.0',
                response:{
                    outputSpeech:{
                        type:"PlainText",
                        text:"Hello, Please ask a question"
                    },
                    shouldEndSession:false
                }
            })
            break;
        case "IntentRequest":
            out.question=_.get(event,'request.intent.slots.QnA_slot.value')
            break;
        case "SessionEndedRequest":
            throw new End() 
            break;
    }
    
    switch(_.get(event,"request.intent.name")){
        case "AMAZON.CancelIntent":
            throw new Respond({
                version:'1.0',
                response:{
                    outputSpeech:{
                        type:"PlainText",
                        text:"GoodBye"
                    },
                    shouldEndSession:true
                }
            })
            break;
        case "AMAZON.RepeatIntent":
            throw new Respond({
                version:'1.0',
                response:{
                    outputSpeech:{
                        type:"PlainText",
                        text:_.get(out,"session.previous.a","Sorry, i do not remember")
                    },
                    shouldEndSession:false
                }
            })
            break;
        case "AMAZON.StopIntent":
            throw new Respond({
                version:'1.0',
                response:{
                    outputSpeech:{
                        type:"PlainText",
                        text:"GoodBye"
                    },
                    shouldEndSession:true
                }
            })
            break;
    }
    return out
}
exports.assemble=function(response){
    return {
        version:'1.0',
        response:_.merge(_.pickBy({
            outputSpeech:_.pickBy({
                type:response.type,
                text:response.type==='PlainText' ? response.message : null,
                ssml:response.type==='SSML' ? response.message : null,
            }),
            card:isCard(response.card) ? _.pickBy({
                type:response.card.imageUrl ? "Simple" : "Standard",
                title:response.card.title,
                image:response.card.imageUrl ? {
                    smallImageUrl:response.card.imageUrl,
                    largeImageUrl:response.card.imageUrl
                } : null
            }) : null
        }),
            {shouldEndSession:false}
        ),
        sessionAttributes:_.mapValues(
            _.get(response,'session',{}),
            x=>_.isString(x) ? x : JSON.stringify(x)
        )
    }
}

function End(){
    this.action="END"
}

function Respond(message){
    this.action="RESPOND"
    this.message=message
}

function isCard(card){
    return card.send
}

