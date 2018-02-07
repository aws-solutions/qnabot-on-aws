var aws=require('../aws')
var lambda= new aws.Lambda()
var _=require('lodash')

module.exports=function(req,res){
    var arn=_.get(req,"session.queryLambda",process.env.LAMBDA_DEFAULT_QUERY)
    console.log("Lambda query:",JSON.stringify({
        req,
        res
    },null,2))
    return lambda.invoke({
        FunctionName:arn,
        InvocationType:"RequestResponse",
        Payload:JSON.stringify({req,res})
    }).promise()
    .then(result=>{
        var parsed=JSON.parse(result.Payload)
        _.merge(req,parsed.req)
        _.merge(res,parsed.res)
    })
}
