var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
var lambda=new aws.Lambda()
var stride=parseInt(process.env.STRIDE)
var _=require('lodash')

module.exports=function(config){
    console.log("Starting")
    return s3.createMultipartUpload({
        Bucket:config.bucket,
        Key:config.key
    }).promise()
    .then(function(result){
        console.log(result)
        config.UploadId=result.UploadId
    })
    .then(()=>lambda.invoke({
        FunctionName:process.env.ES_PROXY,
        Payload:JSON.stringify({
            endpoint:process.env.ES_ENDPOINT,
            method:"POST",
            path: `${config.index}/_search?scroll=1m`,
            body:query(config.filter)
        })
    }).promise()).then(x=>JSON.parse(x.Payload))
    .tap(console.log)
    .then(function(result){
        config.scroll_id=result._scroll_id 
        config.PartNumber=1
        config.status="InProgress"
        var documents=_.get(result,"hits.hits",[]).map(x=>x._source)
        if(documents.length){
            var body=documents.map(x=>{
                x.q=x.questions.map(x=>x.q)
                delete x.questions
                return JSON.stringify(x)
            }).join('\n')+'\n'
            
            return s3.uploadPart({
                Body:body,
                Bucket:config.bucket,
                Key:config.key,
                PartNumber:config.PartNumber,
                UploadId:config.UploadId
            }).promise()
            .then(upload_result=>{
                config.parts=[{
                    ETag:upload_result.ETag,
                    PartNumber:config.PartNumber,
                }]
            })
        }else{
            config.progress="Completed"
        }
    })
}
function query(filter){
    return {
        size:1000,
        query:{
            bool:_.pickBy({
                "must":{"match_all":{}},
                "filter":filter ? {"regexp":{
                    qid:filter
                }}:null
            })
        }
    }
}



