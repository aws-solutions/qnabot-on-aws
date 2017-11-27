var base=require('./base')
var Promise=require('bluebird')
var crypto=Promise.promisifyAll(require('crypto'))
var JWT=require('jsonwebtoken')
var aws=require('../../lib/util/aws')
var ssm=new aws.SSM()
var cfExports=require('../../bin/exports')

var setup=cfExports.then(function(exports){
    return {
        ApiUrl:"https://i4mncppwee.execute-api.us-east-1.amazonaws.com/prod/api",
        AccountId:"613341023709",
        RoleName:"test"
    }
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("Registration",stage,param))
}
