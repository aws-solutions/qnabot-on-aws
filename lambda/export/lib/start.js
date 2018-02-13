var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3()
var lambda=new aws.Lambda()
var stride=parseInt(process.env.STRIDE)
var _=require('lodash')
var load=require('./load')

module.exports=function(config){
    console.log("Starting")
    config.status="InProgress"
    config.parts=[]

    return load(config,{
        endpoint:process.env.ES_ENDPOINT,
        method:"POST",
        path: `${config.index}/_search?scroll=1m`,
        body:query(config.filter)
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



