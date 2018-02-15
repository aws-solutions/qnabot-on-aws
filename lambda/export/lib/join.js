var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
var _=require('lodash')

module.exports=function(config){
    return Promise.all(config.parts.map(part=>{
        console.log(`getting part ${part.key}`)
        return s3.getObject({
            Bucket:config.bucket,
            Key:part.key,
            VersionId:config.version
        }).promise()
        .then(x=>x.Body.toString())
    })).then(parts=>{
        return s3.putObject({
            Bucket:config.bucket,
            Key:config.key,
            Body:parts.join('\n')
        }).promise()
    })
    .then(()=>{
        config.status="Clean"
    })
}    



