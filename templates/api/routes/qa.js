var resource=require('./util/resource')
var lambda=require('./util/lambda')
var fs=require('fs')

module.exports={
"Questions": resource('questions'),
"QuestionsGet":lambda({
    authorization:"AWS_IAM",
    method:"get",
    template:fs.readFileSync(__dirname+'/templates/qa.get.vm','utf8'),
    resource:{"Ref":"Questions"},
    parameterLocations:{
      "method.request.querystring.query": false,
      "method.request.querystring.topic": false,
      "method.request.querystring.from": false,
      "method.request.querystring.filter":false
    }
}),
"QuestionsPut":lambda({
    authorization:"AWS_IAM",
    method:"put",
    template:fs.readFileSync(__dirname+'/templates/qa.put.vm','utf8'),
    resource:{"Ref":"Questions"}
}),
"Question": resource('{ID}',{"Ref":"Questions"}),
"QuestionHead":lambda({
    authorization:"AWS_IAM",
    method:"head",
    template:fs.readFileSync(__dirname+'/templates/qa.head.vm','utf8'),
    resource:{"Ref":"Question"},
    parameterLocations:{
      "method.request.path.Id": true
    }
}),
"QuestionPut":lambda({
    authorization:"AWS_IAM",
    method:"put",
    template:fs.readFileSync(__dirname+'/templates/qa.put.vm','utf8'),
    resource:{"Ref":"Question"}
}),
"QuestionDelete":lambda({
    authorization:"AWS_IAM",
    method:"delete",
    template:fs.readFileSync(__dirname+'/templates/qa.delete.vm','utf8'),
    resource:{"Ref":"Question"},
    parameterLocations:{
      "method.request.path.Id": true
    }
})
}
