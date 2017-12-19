var aws=require('./aws')
var lambda= new aws.Lambda()
var _=require('lodash')

module.exports=function(req,res){
    var arn=_.get(res,"result[0]._source.l")
    console.log("Lambda PostProcess Hooks:",JSON.stringify({req,res},null,2))
    if(arn){
        return lambda.invoke({
            FunctionName:arn,
            InvocationType:"RequestResponse",
            Payload:JSON.stringify({req,res})
        }).promise()
        .then(result=>{
            var parsed=JSON.parse(result.Payload)
            _.merge(req,parsed.req)
            _.merge(res,parsed.res)

            if(parsed.response_type==='redirect'){
                console.log("redirecting")
                res.redirect(req,res)                
            }
        })
    }
}
