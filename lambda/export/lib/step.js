var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
var lambda=new aws.Lambda()
var stride=parseInt(process.env.STRIDE)
var load=require('./load')
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
    return load(config,body)
}
