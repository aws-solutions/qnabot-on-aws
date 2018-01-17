var aws=require('../aws')
var lambda= new aws.Lambda()
var _=require('lodash')

module.exports=function(req,res){
    console.log("pre")
    if(process.env.LAMBDA_PREPROCESS){
        return lambda.invoke({
            FunctionName:process.env.LAMBDA_PREPROCESS,
            InvocationType:"RequestResponse",
            Payload:JSON.stringify({req,res})
        }).promise()
        .then(result=>{
            var parsed=JSON.parse(result.Payload)
            _.merge(req,parsed.req)
            _.merge(res,parsed.res)
        })
    }
}
