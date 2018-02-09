var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
var lambda=new aws.Lambda()
var stride=parseInt(process.env.STRIDE)
var _=require('lodash')

exports.step=function(event,context,cb){
    console.log("step")
    console.log("Request",JSON.stringify(event,null,2))
    var Bucket=event.Records[0].s3.bucket.name
    var Key=decodeURI(event.Records[0].s3.object.key)
    
    var progress
    console.log(Bucket,Key) 
    s3.waitFor('objectExists',{Bucket,Key}).promise()
    .then(()=>s3.getObject({Bucket,Key}).promise())
    .then(x=>JSON.parse(x.Body.toString()))
    .then(function(config){
        console.log("Config:",JSON.stringify(config,null,2))
        if(config.status==="InProgress"){
            var body={
                endpoint:process.env.ES_ENDPOINT,
                method:"POST",
                path:config.scroll_id ? `_search/scroll` : `${config.index}/_search?scroll=1m`,
                body:config.scroll_id ? {
                    scroll:'1m',
                    scroll_id:config.scroll_id
                }: {


                }
            }
            
            return lambda.invoke({
                FunctionName:process.env.ES_PROXY,
                Payload:JSON.stringify(body)
            }).promise()
            .tap(console.log).then(x=>x.hits.hits.map(x=>x._source))
            .then(function(result){
                if(result.length>0){
                    //write to s3
                }else{
                    config.progress=1
                    //finish multi part
                }
            })
            .then(()=>{
                config.scroll_id=
                config.progress=progress
                config.time.rounds+=1
                
                if(config.progress>=1){
                    config.status="Complete"
                    config.time.end=(new Date()).toISOString()
                }
            
                console.log("EndConfig:",JSON.stringify(config,null,2))
                return s3.putObject({
                    Bucket:Bucket,
                    Key:Key,
                    Body:JSON.stringify(config)
                }).promise()
                .then(result=>cb(null))
            })
            .catch(error=>{
                console.log(error)
                config.status="Error"
                config.message=JSON.stringify(error)
                return s3.putObject({
                    Bucket:Bucket,
                    Key:Key,
                    Body:JSON.stringify(config)
                }).promise()
                .then(()=>cb(error))
            })
        }
    })
    .catch(cb)
}


