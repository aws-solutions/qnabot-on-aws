#! /usr/bin/env node
var util=require('./util')
var Promise=require('bluebird')
var skill=require('./assets/skill')
var model=require('./assets/en-US')
var fs=Promise.promisifyAll(require('fs'))

Promise.join(
    util.api({
        path:"/bot/alexa",
        method:"GET"
    })
    .then(x=>x.schema.intents),
    util.api({
        path:"/bot",
        method:"GET"
    })
    .then(x=>x.lambdaArn),
    util.api({
        path:"/bot/utterances",
        method:"GET"
    })
)
.spread(function(intents,lambda,utterances){
    skill.skillManifest.apis.custom.endpoint.uri=lambda

    intents.forEach(function(x){
        x.name=x.intent
        delete x.intent
    })
    model.interactionModel.languageModel.intents=intents 
    
    model.interactionModel.languageModel.types[0]
        .values=utterances.map(x=>{ return {
            name:{value:x}
        }})
    model.interactionModel.languageModel.intents[0].samples=["{QnA_slot}"]

    
    return Promise.join(
        fs.writeFileAsync(__dirname+'/files/model.json',JSON.stringify(model,null,2)),
        fs.writeFileAsync(__dirname+'/files/skill.json',JSON.stringify(skill,null,2))
    )
})


