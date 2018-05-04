var response = require('cfn-response')
var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var cb=new aws.CodeBuild()
var s3=new aws.S3()
var ecr=new aws.ECR()
var lambda=new aws.Lambda()

exports.clear = function(event, context) {
    console.log(JSON.stringify(event,null,2))

    if(event.RequestType==="Delete"){
        Delete(event.ResourceProperties)
        .then(()=>response.send(event, context, response.SUCCESS))
        .catch(x=>{
            console.log(x)
            response.send(event, context, response.FAILED)
        })
    }else{
        response.send(event, context, response.SUCCESS)
    }
}


function Delete(params){
    return new Promise(function(res,rej){
        function next(){
            s3.listObjectsV2({
                Bucket:params.Bucket
            }).promise()
            .then(x=>x.Contents)
            .then(function(files){
                return files.map(file=>{return {
                    Key:file.Key
                }  })
            })
            .then(function(keys){
                console.log("going to delete",keys)
                if(keys.length>0){ 
                    return s3.deleteObjects({
                        Bucket:params.Bucket,
                        Delete:{
                            Objects:keys
                        }
                    }).promise()
                    .then(()=>next())
                    .catch(rej)
                }else{
                    res()
                }
            })
        }
        next()
    })
}
