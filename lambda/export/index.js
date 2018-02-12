var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
var lambda=new aws.Lambda()
var stride=parseInt(process.env.STRIDE)
var _=require('lodash')
var start=require('./lib/start')
var step=require('./lib/step')

exports.step=function(event,context,cb){
    console.log("step")
    console.log("Request",JSON.stringify(event,null,2))
    var Bucket=event.Records[0].s3.bucket.name
    var Key=decodeURI(event.Records[0].s3.object.key)
    
    console.log(Bucket,Key) 
    
    s3.waitFor('objectExists',{Bucket,Key}).promise()
    .then(()=>s3.getObject({Bucket,Key}).promise())
    .then(x=>JSON.parse(x.Body.toString()))
    .then(function(config){
        if(config.status!=="Error" || config.status!=="Completed"){
            return Promise.try(function(){
                console.log("Config:",JSON.stringify(config,null,2))
                if(config.status==="InProgress"){
                    return step(config)   
                }else if(config.status==="Started"){
                    return start(config)
                }
            })
            .catch(error=>{
                console.log(error)
                config.status="Error"
                config.message=_.get(error,'message',JSON.stringify(error))
            })
            .then(()=>s3.putObject({Bucket,Key,Body:JSON.stringify(config)}).promise())
        }
    })
    .catch(cb)
}
