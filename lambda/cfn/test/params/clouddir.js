var base=require('./base')
var Promise=require('bluebird')
var cfExports=require('../../bin/exports')

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return base("CloudDir",stage,{
        Schema:require('./schema'),
        Name:"TestDir",
        AccountId:"613341023709"
    })
}
