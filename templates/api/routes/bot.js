var resource=require('./util/resource')
var lambda=require('./util/lambda')
var fs=require('fs')

module.exports={
"Bot": resource('bot'),
"BotStatus": resource('status',{"Ref":"Bot"}),
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
    resource:{"Ref":"Bot"}
}),
"BotGetStatus":lambda({
    authorization:"AWS_IAM",
    method:"get",
    template:fs.readFileSync(__dirname+'/templates/bot.status.vm','utf8'),
    resource:{"Ref":"BotStatus"}
})
}
