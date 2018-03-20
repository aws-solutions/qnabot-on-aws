var aws=require('../aws')
var lambda= new aws.Lambda()
var _=require('lodash')

module.exports=function(req,res){
    var arn=_.get(req,"session.queryLambda",process.env.LAMBDA_DEFAULT_QUERY)
    console.log("Lambda query:",JSON.stringify({
        req,
        res
    },null,2))
    console.log("Invokeing QueryLambda",arn)
    return lambda.invoke({
        FunctionName:arn,
        InvocationType:"RequestResponse",
        Payload:JSON.stringify({req,res})
    }).promise()
    .then(result=>{
        if(result.FunctionError){
            var parsed=JSON.parse(result.Payload)
            console.log("Query Response",JSON.stringify(parsed))
            return parsed
        }else{
            throw result.FunctionError
        }
    })
}
