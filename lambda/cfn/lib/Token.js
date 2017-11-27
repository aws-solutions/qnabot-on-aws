var Promise=require('./util/promise')
var crypto=Promise.promisifyAll(require('crypto'))
var JWT=require('jsonwebtoken')
var aws=require('./util/aws')
var ssm=new aws.SSM()
var s3=new aws.S3()

var iterations=10000
var size=512
var algo='sha512'

module.exports=class CognitoUser extends require('./base') {
    constructor(){
        super()
    }

    Create(params,reply){
        var random=crypto.randomBytesAsync(256/8)
        
        var store=random.then(x=>crypto.pbkdf2Async(x,process.env.SALT,iterations,size,algo))
        .then(secret=>secret.toString("Base64"))
        .tap(function(secret){
            return ssm.putParameter({
                Name:params.Parameter,
                Type:"String",
                Value:secret.toString(),
                Overwrite:true
            }).promise()
        })
        .then(function(secret){
            var token=JWT.sign(
                {secret,iterations,size,algo},null,
                {algorithm:"none"}
            )
            return s3.putObject({
                Bucket:params.TokenBucket,
                Key:params.TokenKey,
                Body:token
            }).promise()
        })
        .then(()=>reply(null,"Token",{
            iterations,size,algo,location:params.TokenBucket+'/token' 
        }))
        .catch(err=>reply(err))
    }
}
