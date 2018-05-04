var base=require('./base')
var Promise=require('bluebird')
var aws=require('../../lib/util/aws')
var s3=new aws.S3()
var range=require('range').range
var outputs=require('../../../../bin/exports')

var setup=outputs('dev/bucket').tap(function(output){
    return Promise.all(range(2000).map(x=>{
        return s3.putObject({
            Bucket:output.Bucket,
            Key:"DeleteMe-"+x,
            Body:"Please no!!!-"+x
        }).promise()
    })).delay(2000)
})
.then(function(output){
    return {
        Bucket:output.Bucket
    }
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("S3Clear",stage,param))
}
