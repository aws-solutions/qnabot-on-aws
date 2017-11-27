var base=require('./base')
var Promise=require('bluebird')
var aws=require('../../lib/util/aws')
var s3=new aws.S3()
var cfExports=require('../../bin/exports')

var setup=cfExports.tap(function(exports){
    return s3.putObject({
        Bucket:exports["QNA-DEV-BUCKET"],
        Key:"DeleteMe",
        Body:"Please no!!!"
    }).promise().delay(2000)
})
.then(function(exports){
    return {
        Bucket:exports["QNA-DEV-BUCKET"]
    }
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("S3Clear",stage,param))
}
