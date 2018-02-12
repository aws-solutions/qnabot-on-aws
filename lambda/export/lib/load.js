var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
var lambda=new aws.Lambda()
var stride=parseInt(process.env.STRIDE)
var _=require('lodash')

module.exports=function(config,body){
    return lambda.invoke({
        FunctionName:process.env.ES_PROXY,
        Payload:JSON.stringify(body)
    }).promise()
    .then(x=>JSON.parse(x.Payload))
    .tap(console.log)
    .then(function(result){
        config.scroll_id=result._scroll_id 
        config.PartNumber++
        config.status="InProgress"
        
        var documents=_.get(result,"hits.hits",[])
        if(documents.length){
            var body=documents.map(x=>{
                if(x._type===config.type){ 
                    var out=x._source
                    out.q=out.questions.map(y=>y.q)
                    delete out.questions
                    return JSON.stringify(out)
                }else{
                    return JSON.stringify(x._source)
                }
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



