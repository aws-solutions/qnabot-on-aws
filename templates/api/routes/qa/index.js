var resource=require('../util/resource')
var lambda=require('../util/lambda')
var fs=require('fs')

module.exports=Object.assign(
require('./schema'),{
"Questions": resource('questions'),
"QuestionsGet":lambda({
    authorization:"AWS_IAM",
    method:"get",
    lambda:{"Fn::GetAtt":["ESProxyLambda","Arn"]},
    template:fs.readFileSync(__dirname+'/single/get.vm','utf8'),
    responseTemplate:fs.readFileSync(__dirname+'/single/get.resp.vm','utf8'),
    resource:{"Ref":"Questions"},
    parameterLocations:{
      "method.request.querystring.query": false,
      "method.request.querystring.topic": false,
      "method.request.querystring.from": false,
      "method.request.querystring.filter":false,
      "method.request.querystring.order":false,
      "method.request.querystring.perpage":false,
    }
}),
"QuestionsDelete":lambda({
    authorization:"AWS_IAM",
    method:"delete",
    lambda:{"Fn::GetAtt":["ESProxyLambda","Arn"]},
    template:fs.readFileSync(__dirname+'/collection/delete.vm','utf8'),
    responseTemplate:fs.readFileSync(__dirname+'/collection/delete.resp.vm','utf8'),
    defaultResponse:204,
    resource:{"Ref":"Questions"}
}),
"Question": resource('{ID}',{"Ref":"Questions"}),
"QuestionHead":lambda({
    authorization:"AWS_IAM",
    method:"head",
    errors:[{   
        "SelectionPattern":".*status\":404.*",
        "StatusCode":404,
        "ResponseTemplates":{
            "application/json":fs.readFileSync(__dirname+"/../error/error.vm",'utf8')
        }
    }],
    lambda:{"Fn::GetAtt":["ESProxyLambda","Arn"]},
    template:fs.readFileSync(__dirname+'/single/head.vm','utf8'),
    responseTemplate:fs.readFileSync(__dirname+'/single/head.resp.vm','utf8'),
    resource:{"Ref":"Question"},
    parameterLocations:{
      "method.request.path.Id": true
    }
}),
"QuestionPut":lambda({
    authorization:"AWS_IAM",
    method:"put",
    lambda:{"Fn::GetAtt":["ESProxyLambda","Arn"]},
    template:fs.readFileSync(__dirname+'/single/put.vm','utf8'),
    responseTemplate:fs.readFileSync(__dirname+'/single/put.resp.vm','utf8'),
    resource:{"Ref":"Question"},
    parameterLocations:{
      "method.request.path.Id": true
    },
    defaultResponse:201
}),
"QuestionsOptions":lambda({
    authorization:"AWS_IAM",
    method:"options",
    lambda:{"Fn::GetAtt":["SchemaLambda","Arn"]},
    template:fs.readFileSync(__dirname+'/single/options.vm','utf8'),
    resource:{"Ref":"Questions"}
}),
"QuestionDelete":lambda({
    authorization:"AWS_IAM",
    method:"delete",
    lambda:{"Fn::GetAtt":["ESProxyLambda","Arn"]},
    template:fs.readFileSync(__dirname+'/single/delete.vm','utf8'),
    responseTemplate:fs.readFileSync(__dirname+'/single/delete.resp.vm','utf8'),
    resource:{"Ref":"Question"},
    defaultResponse:204,
    parameterLocations:{
      "method.request.path.Id": true
    }
})
})
