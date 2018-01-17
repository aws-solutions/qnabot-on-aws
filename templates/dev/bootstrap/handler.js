var response = require('cfn-response')
var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var s3=new aws.S3()

exports.handler = function(event, context) {
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
            s3.listObjectVersions({
                Bucket:params.Bucket
            }).promise()
            .then(x=>x.Versions.concat(x.DeleteMarkers))
            .then(function(files){
                return files.map(file=>{return {
                    Key:file.Key,
                    VersionId:file.VersionId
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
