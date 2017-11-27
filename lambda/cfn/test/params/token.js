var base=require('./base')
var Promise=require('bluebird')
var crypto=Promise.promisifyAll(require('crypto'))
var cfExports=require('../../bin/exports')

var aws=require('../../lib/util/aws')
var ssm=new aws.SSM()

var setup=cfExports.tap(function(exports){
    return ssm.putParameter({
        Name:exports["ENVOY-PARAMETER"],
        Type:"String",
        Value:"secret",
        Overwrite:true
    }).promise()
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(function(exports){
        return (base("Token",stage,{
            AccountId:123456,
            ApiUrl:"host.com/api",
            Parameter:exports["ENVOY-PARAMETER"],
            TokenBucket:exports["ENVOY-SOURCE-BUCKET"],
            TokenKey:"token"
        }))
    })
}
