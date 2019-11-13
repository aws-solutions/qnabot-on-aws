var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
var _=require('lodash')

module.exports=function(config){
    return Promise.try(function(){
        if(config.parts.length>0){
            return s3.deleteObjects({
                Bucket:config.bucket,
                Delete:{
                    Objects:config.parts.map(part=>{
                        return {
                            Key:part.key,
                            VersionId:config.version            
                        }
                    }),
                    Quiet:true
                }
            }).promise()
        }
    })
    .then(()=>{
        config.status="Completed"
    })
}    



