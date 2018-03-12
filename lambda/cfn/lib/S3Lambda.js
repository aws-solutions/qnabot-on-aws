var aws=require('./util/aws')
var Promise=require('./util/promise')
var cfnLambda=require('cfn-lambda')
var base=require('./base.js')
var s3=new aws.S3()

module.exports=class S3Lambda extends base{
    constructor(){
        super('BucketNotificationConfiguration')
    }
    
    Create(params,reply){
        var that=this
        Promise.retry(
            ()=>s3.putBucketNotificationConfiguration(params).promise()
        )
        .then(()=>reply(null))
        .catch(reply)
    }

    Delete(ID,params,reply){
        params
            .NotificationConfiguration
            .LambdaFunctionConfigurations=[]
        this.Create(params,reply) 
    }
}

