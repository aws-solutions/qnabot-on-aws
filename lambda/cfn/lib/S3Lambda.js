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

    /**
     Delete has in the past removed the putBucketNotificationConfiguration by setting
     the configuration to an empty array. Change to support upgrading a stack to the new
     use of nested stacks for import and export. The deletion of the original resources
     occurred after the new configuration had been set. This caused import and export
     to fail as the creation event of job files in the S3 bucket went unnoticed. This fix
     has no impact on bucket cleanup / removal.
     */
    Delete(ID,params,reply){
        reply(null);
    }

    Update(ID,params,oldparams,reply){
        this.Create(params,reply)
    }
}

