var base=require('./base')
var Promise=require('bluebird')

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return base("Random",stage,{Bytes:512})
}
