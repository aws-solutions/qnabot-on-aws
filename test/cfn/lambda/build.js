var response = require('cfn-response')
var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var cb=new aws.CodeBuild()
var s3=new aws.S3()
var ecr=new aws.ECR()
var lambda=new aws.Lambda()

exports.build = function(event, context) {
    console.log(JSON.stringify(event,null,2))
    if(event.StackId){
        if(event.RequestType==="Create"){
            cb.startBuild({
                projectName:event.ResourceProperties.name,
                sourceVersion:event.ResourceProperties.branch
            }).promise()
            .then(x=>new Promise((res,rej)=>setTimeout(()=>res(x),10*1000)))
            .then(x=>{
                return lambda.invoke({
                    FunctionName:process.env.AWS_LAMBDA_FUNCTION_NAME,
                    InvocationType:"Event",
                    Payload:JSON.stringify({
                        event,context,id:x.build.id
                    })
                }).promise()
            })
            .catch(x=>{
                console.log(x)
                response.send(event, context, response.FAILED)
            })
        }else{
            response.send(event, context, response.SUCCESS)
        }
    }else{
        event.context.done=context.done
        cb.batchGetBuilds({
            ids:[event.id]
        }).promise()
        .then(x=>{
            console.log(x)
            var status=x.builds[0].buildStatus
            if(status==="SUCCEEDED"){
                response.send(event.event, event.context, response.SUCCESS)
            }else if(status==="IN_PROGRESS"){
                setTimeout(()=>lambda.invoke({
                    FunctionName:process.env.AWS_LAMBDA_FUNCTION_NAME,
                    InvocationType:"Event",
                    Payload:JSON.stringify({
                        event:event.event,
                        context:event.context,
                        id:x.builds[0].id
                    })
                }).promise(),10*1000)
            }else{
                response.send(event.event, event.context, response.FAILED)
            }
        })
        .catch(x=>{
            console.log(x)
            response.send(event.event, event.context, response.FAILED)
        })
    }
}

