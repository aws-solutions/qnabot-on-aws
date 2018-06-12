var aws=require('../aws')
var lambda= new aws.Lambda()

exports.getLambdaArn=function(name){
    var match=name.match(/QNA:(.*)/)
    if(match){
        return process.env[match[1]] || name
    }else{
        return name
    }
}

exports.invokeLambda=async function(params){
    console.log(`Invoking ${params.FunctionName}`)
    var result=await lambda.invoke({
        FunctionName:params.FunctionName,
        InvocationType:params.InvocationType || "RequestResponse",
        Payload:params.Payload || JSON.stringify({
            req:params.req,
            res:params.res
        })
    }).promise() 
    
    console.log(result)
    if(!result.FunctionError){
        try{
            if(result.Payload){
                var parsed=JSON.parse(result.Payload)
                console.log("Response",JSON.stringify(parsed,null,2))
                return parsed
            }
        }catch(e){
            console.log(e)
            throw e
        }
    }else{
        console.log(result.FunctionError)
        throw result.FunctionError
    }
}
