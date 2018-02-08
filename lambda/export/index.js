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
            return s3.getObject({
                Bucket:config.bucket,
                Key:config.key,
                VersionId:config.version,
                Range:`bytes=${config.start}-${config.end}`
            }).promise()
            .then(function(result){
                config.buffer+=result.Body.toString()
                
                var objects=config.buffer.split(/\n/)
                try {
                    JSON.parse(objects[objects.length-1])
                    config.buffer=""
                } catch(e){
                    config.buffer=objects.pop()
                }
                var out=[] 
                objects.filter(x=>x).forEach(x=>{
                    try{
                        var obj=JSON.parse(x)
                        obj.questions=obj.q.map(x=>{return {q:x}})
                        delete obj.q
                        out.push(JSON.stringify({
                            index:{
                                "_index":process.env.ES_INDEX,
                                "_type":process.env.ES_TYPE,
                                "_id":obj.qid
                            }
                        }))
                        config.count+=1
                        out.push(JSON.stringify(obj))
                    } catch(e){
                        config.failed+=1
                        console.log("Failed to Parse:",e,x)
                    }
                })
                console.log(result.ContentRange)
                tmp=result.ContentRange.match(/bytes (.*)-(.*)\/(.*)/)
                progress=(parseInt(tmp[2])+1)/parseInt(tmp[3])

                return out.join('\n')+'\n'
            })
            .then(function(result){
                var body={
                    endpoint:process.env.ES_ENDPOINT,
                    method:"POST",
                    path:"/_bulk",
                    body:result
                }
                
                return lambda.invoke({
                    FunctionName:process.env.ES_PROXY,
                    Payload:JSON.stringify(body)
                }).promise()
                .tap(console.log)
                .then(x=>{
                    config.EsErrors.push(JSON.parse(_.get(x,"Payload","{}")).errors)
                })
            })
            .then(()=>{
                config.start=(config.end+1)
                config.end=config.start+config.stride
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


