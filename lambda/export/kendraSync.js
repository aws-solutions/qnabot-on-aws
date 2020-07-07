var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
const AWSS3 = require('aws-sdk/clients/s3')
var lambda=new aws.Lambda()
var stride=parseInt(process.env.STRIDE)
var _=require('lodash')
var start=require('./lib/start')
var step=require('./lib/step')
var join=require('./lib/join')
var clean=require('./lib/clean')
var parse=require('./parseJSON')
var create=require('./createFAQ')

exports.performKendraSync=function(event,context,cb){
    console.log("step")
    console.log("Request",JSON.stringify(event,null,2))
    var Bucket=event.Records[0].s3.bucket.name
    var Key=decodeURI(event.Records[0].s3.object.key)
    var VersionId=_.get(event,"Records[0].s3.object.versionId")
    console.log(Bucket,Key) 
    
    s3.waitFor('objectExists',{Bucket,Key,VersionId}).promise()
    .then(()=>s3.getObject({Bucket,Key,VersionId}).promise())
    .then(x=>JSON.parse(x.Body.toString()))
    .then(function(config){
        if(config.status!=="Error" && config.status!=="Completed"){
            return Promise.try(function(){
                console.log("Config:",JSON.stringify(config,null,2))
                switch(config.status){
                    case 'Started':
                        return start(config);
                    case 'InProgress':
                        return step(config);
                    case "Join":
                        return join(config);
                    case "Clean":
                        return clean(config);
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
    
    
    // TODO: another trigger to start converting JSON into FAQ
    // note that once the S3 bucket has the kendra-data file, you are good to go
    var parseJSONparams = {
        csv_name:'qna_FAQ.csv',
        input_path:Bucket+'/'+Key,
        s3_bucket:'explore-kendra-solar',
        output_path:parseJSONparams.s3_bucket + '/' + parseJSONparams.csv_name
    }
    parse.handler(parseJSONparams).promise()
    .done(console.log('Completed parsing JSON'));

    var createFAQparams = {
        faq_name:'qna-facts',
        faq_index_id:'e1c23860-e5c8-4409-ae26-b05bd6ced00a',
        csv_path:parseJSONparams.output_path,
        csv_name:parseJSONparams.csv_name,
        s3_bucket:parseJSONparams.s3_bucket,
        kendra_s3_access_role:'arn:aws:iam::425742325899:role/service-role/AmazonKendra-question-bucketer',
        region:'use-east-1'
    }
    create.handler(createFAQparams)
    .done(console.log('Completed converting to CSV'));

}
