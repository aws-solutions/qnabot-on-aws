var stack=require('../util').stacktest

var stack=require('../util').stacktest
var Promise=require('bluebird')
var config=require('../../config')
var outputs=require('../../bin/exports')

module.exports=Promise.join(
    Promise.resolve(require('../domain')),
    outputs('dev/bootstrap')
).spread(function(base,output){
    base.Parameters.BootstrapBucket.Default=output.Bucket
    base.Parameters.BootstrapPrefix.Default=output.Prefix
    return base
})


