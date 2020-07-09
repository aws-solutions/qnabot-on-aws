var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
const AWSS3 = require('aws-sdk/clients/s3')
var _=require('lodash')
var parse=require('./parseJSON')
var create=require('./createFAQ')

exports.performSync=function(event,context,cb){
    console.log("Request",JSON.stringify(event,null,2))
    var Bucket=event.Records[0].s3.bucket.name
    var Key=decodeURI(event.Records[0].s3.object.key)
    var VersionId=_.get(event,"Records[0].s3.object.versionId")
    console.log(Bucket,Key) 
    
    s3.waitFor('objectExists',{Bucket,Key,VersionId}).promise()
    .then(()=>s3.getObject({Bucket,Key,VersionId}).promise())
    .then(x=>JSON.parse(x.Body.toString()))
    .then(async function(content){
        var parseJSONparams = {
            csv_name:'qna_FAQ.csv',
            content:content,
            output_path:'/tmp/qna_FAQ.csv',
        }
        parse.handler(parseJSONparams).then(()=>{
            console.log("Parsed content JSON into CSV stored locally");
                
            var createFAQparams = {
                faq_name:'qna-facts',
                faq_index_id:process.env.KENDRA_INDEX,
                csv_path:parseJSONparams.output_path,
                csv_name:parseJSONparams.csv_name,
                s3_bucket:process.env.OUTPUT_S3_BUCKET,
                s3_key:"kendra_csv" + "/" + parseJSONparams.csv_name,
                kendra_s3_access_role:process.env.KENDRA_ROLE,
                region:process.env.REGION
            }
            console.log('s3 bucket is ' + createFAQparams.s3_bucket);
            console.log('kendra role is ' + createFAQparams.kendra_s3_access_role);
            create.handler(createFAQparams)
            console.log('Completed CSV converting to FAQ');
        });
    })
    .catch(cb)
    
    return 'Synced';
}
