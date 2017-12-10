var resource=require('./util/resource')
var lambda=require('./util/lambda')
var fs=require('fs')

module.exports={
"Bot": resource('bot'),
"UtterancesApi": resource('utterances',{"Ref":"Bot"}),
"BotPost":lambda({
    authorization:"AWS_IAM",
    method:"post",
    template:fs.readFileSync(__dirname+'/templates/bot.post.vm','utf8'),
    resource:{"Ref":"Bot"}
}),
"BotGet":lambda({
    authorization:"AWS_IAM",
    method:"get",
    template:fs.readFileSync(__dirname+'/templates/bot.get.vm','utf8'),
    resource:{"Ref":"Bot"},
    responseTemplate:fs.readFileSync(__dirname+'/templates/bot.get.resp.vm','utf8')
}),
"UtterancesGet":lambda({
    authorization:"AWS_IAM",
    method:"get",
    template:fs.readFileSync(__dirname+'/templates/utterance.get.vm','utf8'),
    resource:{"Ref":"UtterancesApi"}
}),
"BotDoc":{
    "Type" : "AWS::ApiGateway::DocumentationPart",
    "Properties" : {
        "Location" : {
            "Type":"RESOURCE",
            "Path":"/bot"
        },
        "Properties" :JSON.stringify({
           description:""  
        }),
        "RestApiId" : {"Ref":"API"}
    }
}
}


