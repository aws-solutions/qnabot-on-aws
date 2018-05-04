var base=require('./base')
var Promise=require('bluebird')
var aws=require('../../lib/util/aws')
var s3=new aws.S3()
var outputs=require('../../../../bin/exports')

var setup=outputs('dev/bucket').tap(function(output){
    return s3.putObject({
        Bucket:output.Bucket,
        Key:"VersionMe",
        Body:"Please no!!!"
    }).promise().delay(2000)
})
.then(function(output){
    return {
        Bucket:output.Bucket,
        Key:"VersionMe"
    }
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("S3Version",stage,param))
}
