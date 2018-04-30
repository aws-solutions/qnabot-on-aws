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
exports.assemble=function(request,response){
    return {
        version:'1.0',
        response:{
            outputSpeech:_.pickBy({
                type:response.type,
                text:response.type==='PlainText' ? response.message : null,
                ssml:response.type==='SSML' ? response.message : null,
            }),
            card:response.card.imageUrl ? {
                type:"Standard",
                title:response.card.title || request.question,
                text:_.has(response.card,'subTitle')? response.card.subTitle +"\n\n" + response.message:response.message,
                image:{
                    smallImageUrl:response.card.imageUrl,
                    largeImageUrl:response.card.imageUrl
                }
            } : {
                type:"Simple",
                title:response.card.title || request.question || "Image",
                content:response.message
            },
            shouldEndSession:false
        },
        sessionAttributes:_.get(response,'session',{})
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

