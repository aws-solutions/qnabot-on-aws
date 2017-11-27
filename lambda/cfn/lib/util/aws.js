var Promise=require('./promise')
var aws=require('aws-sdk')

aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION || 'us-east-1'
aws.config.signatureVersion='v4'

module.exports=aws
