var base=require('./base')
var Promise=require('bluebird')
var outputs=require('../../../../bin/exports')

var setup=outputs('dev/cognito').then(function(output){
    var param={
        UserPool:output.UserPool,
        Client:output.Client,
        IdentityPoolId:output.IdPool,
        Roles:{'authenticated':output.Role},
        RoleMappings:[{
            ClientId:output.Client,
            UserPool:output.UserPool,
            Type:"Rules",
            AmbiguousRoleResolution:"Deny",
            RulesConfiguration:{Rules:[{
                Claim:"Cognito:Group",
                MatchType:"Equals",
                Value:"Admin",
                RoleARN:output.Role
            }]}
        }]
    }
    return param
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("CognitoRole",stage,param))
}
