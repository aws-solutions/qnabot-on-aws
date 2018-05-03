var aws=require('../aws')
var lambda= new aws.Lambda()
var Promise=require('bluebird')
var _=require('lodash')
var util=require('./util')

module.exports=function(req,res){
    var arn=util.getLambdaArn(
        _.get(req,"session.queryLambda",process.env.LAMBDA_DEFAULT_QUERY))
    console.log("Lambda query:",JSON.stringify({
        req,
        res
    },null,2))
    console.log("Invoking QueryLambda",arn)
    return lambda.invoke({
        FunctionName:arn,
        InvocationType:"RequestResponse",
        Payload:JSON.stringify({req,res})
    }).promise()
    .then(result=>{
        console.log(result)
        if(!result.FunctionError){
            try{
                var parsed=JSON.parse(result.Payload)
                console.log("Query Response",JSON.stringify(parsed))
                return parsed
            }catch(e){
                console.log(e)
            }
        }else{
            console.log(result.FunctionError)
            return Promise.reject(result.FunctionError)
        }
    })
}
