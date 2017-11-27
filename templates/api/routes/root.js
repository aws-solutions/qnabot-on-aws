var resource=require('./util/resource')
var lambda=require('./util/lambda')
var fs=require('fs')


module.exports={
"RootPut":lambda({
    authorization:"AWS_IAM",
    method:"put",
    template:fs.readFileSync(__dirname+'/templates/qa.put.vm','utf8'),
    resource:{"Fn::GetAtt": ["API","RootResourceId"]}
}),
"RootGet": lambda({
    authorization:"AWS_IAM",
    method:"get",
    template:fs.readFileSync(__dirname+'/templates/root.get.vm','utf8'),
    resource:{"Fn::GetAtt": ["API","RootResourceId"]},
    RequestParameters:{
      "method.request.querystring.from": false,
      "method.request.querystring.perpage": false,
      "method.request.querystring.filter": false
    }
}),
"RootPost":lambda({
    authorization:"AWS_IAM",
    method:"post",
    template:fs.readFileSync(__dirname+'/templates/bot.post.vm','utf8'),
    resource:{"Fn::GetAtt": ["API","RootResourceId"]}
})
}
