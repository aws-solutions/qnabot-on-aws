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
        config.status="InProgress"
        
        var documents=_.get(result,"hits.hits",[])
        if(documents.length){
            var body=documents.map(x=>{
                var out=x._source
                out.type=x._type
                if(out.type==='qna'){ 
                    out.q=out.questions.map(y=>y.q)
                    delete out.questions
                }else{
                }
                return JSON.stringify(out)
            }).join('\n')
            var key=`${config.tmp}/${config.parts.length+1}` 
            return s3.putObject({
                Body:body,
                Bucket:config.bucket,
                Key:key
            }).promise()
            .then(upload_result=>{
                config.parts.push({
                    version:upload_result.VersionId,
                    key:key
                })
            })
        }else{
            config.status="Join"
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



