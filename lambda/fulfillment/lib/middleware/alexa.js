var _=require('lodash');
var translate = require('./multilanguage.js');

async function get_welcome_message(req, locale){
    const welcome_message = _.get(req,'_settings.DEFAULT_ALEXA_LAUNCH_MESSAGE', 'Hello, Please ask a question');
    if (req._settings.ENABLE_MULTI_LANGUAGE_SUPPORT){
        return await translate.translateText(welcome_message,'en',locale);
    } else {
        return welcome_message;
    }
}
async function get_stop_message(req, locale){
    const stop_message = _.get(req,'_settings.DEFAULT_ALEXA_STOP_MESSAGE', 'Goodbye');
    if (req._settings.ENABLE_MULTI_LANGUAGE_SUPPORT){
        return await translate.translateText(stop_message,'en',locale); 
    } else {
        return stop_message;
    }
}

exports.parse=async function(req){
    var event = req._event;
    var out={
        _type:"ALEXA",
        _userId:_.get(event,"session.user.userId","Unknown Alexa User"),
        original:event,
        session:_.mapValues(
            _.get(event,'session.attributes',{}),
            x=>{
                try {
                    return JSON.parse(x);
                } catch(e){
                    return x;
                }
            }
        ),
        channel:null,
    };
    // set userPreferredLocale from Alexa request
    const alexa_locale = _.get(event,'request.locale').split("-")[0];
    out.session.userPreferredLocale = alexa_locale;
    console.log("Set userPreferredLocale:", out.session.userPreferredLocale);
    var welcome_message;
    var stop_message;
    
    switch(_.get(event,"request.type")){
        case "LaunchRequest":
            welcome_message = await get_welcome_message(req,alexa_locale);
            throw new Respond({
                version:'1.0',
                response:{
                    outputSpeech:{
                        type:"PlainText",
                        text: welcome_message
                    },
                    card: {
                      type: "Simple",
                      title: "Welcome",
                      content:welcome_message
                    },
                    shouldEndSession:false
                }
            });
            break;
        case "IntentRequest":
            out.question=_.get(event,'request.intent.slots.QnA_slot.value');
            break;
        case "SessionEndedRequest":
            throw new End() 
            break;
    }
    
    switch(_.get(event,"request.intent.name")){
        case "AMAZON.CancelIntent":
            stop_message = await get_stop_message(req,alexa_locale);
            throw new Respond({
                version:'1.0',
                response:{
                    outputSpeech:{
                        type:"PlainText",
                        text:stop_message
                    },
                    card: {
                      type: "Simple",
                      title: "Cancel",
                      content:stop_message
                    },
                    shouldEndSession:true
                }
            })
            break;
        case "AMAZON.RepeatIntent":
            welcome_message = await get_welcome_message(req,alexa_locale);
            console.log("At Repeat Intent")
            console.log(JSON.stringify(out))
            throw new Respond({
                version:'1.0',
                response: _.get(out,"session.cachedOutput",{outputSpeech:{type:"PlainText",text:welcome_message},shouldEndSession:false})
            })
            break;
        case "AMAZON.StopIntent":
            stop_message = await get_stop_message(req,alexa_locale);
            throw new Respond({
                version:'1.0',
                response:{
                    outputSpeech:{
                        type:"PlainText",
                        text:stop_message
                    },
                    card: {
                      type: "Simple",
                      title: "Stop",
                      content:stop_message
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
            card:_.get(response,"card.imageUrl") ? {
                type:"Standard",
                title:response.card.title || request.question,
                text:_.has(response.card,'subTitle')? response.card.subTitle +"\n\n" + response.plainMessage:response.plainMessage,
                image:{
                    smallImageUrl:response.card.imageUrl,
                    largeImageUrl:response.card.imageUrl
                }
            } : {
                type:"Simple",
                title:_.get(response,"card.title") || request.question || "Image",
                content:_.has(response.card,'subTitle')? response.card.subTitle +"\n\n" + response.plainMessage:response.plainMessage
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

