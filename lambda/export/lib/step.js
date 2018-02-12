var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
var lambda=new aws.Lambda()
var stride=parseInt(process.env.STRIDE)
var _=require('lodash')

module.exports=function(config){
    var body={
        endpoint:process.env.ES_ENDPOINT,
        method:"POST",
        path:`_search/scroll`,
        body:{
            scroll:'1m',
            scroll_id:config.scroll_id
        }
    }
    return lambda.invoke({
        FunctionName:process.env.ES_PROXY,
        Payload:JSON.stringify(body)
    }).promise().then(x=>JSON.parse(x.Payload))
    .then(function(result){
        console.log(result)
        config.scroll_id=result._scroll_id 
        config.PartNumber++

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
                config.parts.push({
                    ETag:upload_result.ETag,
                    PartNumber:config.PartNumber
                })
            })
        }else{
            return s3.completeMultipartUpload({
                Bucket:config.bucket,
                Key:config.key,
                MultipartUpload:{
                    Parts:config.parts
                },
                UploadId:config.UploadId
            }).promise()
            .then(()=>{
                config.progress="Completed"
            })
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



