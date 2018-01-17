var base=require('./base')
var Promise=require('bluebird')
var outputs=require('../../../../bin/exports')

var setup=outputs('dev/cognito').then(function(output){
    var param={
        UserPool:output.UserPool,
        Client:output.Client,
        LoginRedirectUrl:"https://exampe.com",
        LogoutRedirectUrl:"https://exampe.com" 
    }
    return param
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("CognitoDomain",stage,param))
}
