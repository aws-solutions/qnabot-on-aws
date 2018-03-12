var aws=require('./aws')
var lambda=new aws.Lambda()

module.exports=function(status){
    return lambda.invoke({
       FunctionName:process.env.POLL_LAMBDA,
       InvocationType:"Event",
       Payload:"{}"
    }).promise()
}
