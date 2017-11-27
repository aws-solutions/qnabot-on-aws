var base=require('./base')
var Promise=require('bluebird')
var cfExports=require('../../bin/exports')

var setup=cfExports.then(function(exports){
    var param={
        UserPool:exports["QNA-DEV-USERPOOL"],
        Client:exports["QNA-DEV-CLIENT"],
        IdentityPoolId:exports["QNA-DEV-IDPOOL"],
        Roles:{'authenticated':exports["QNA-DEV-ROLE-ARN"]},
        RoleMappings:[{
            ClientId:exports["QNA-DEV-CLIENT"],
            UserPool:exports["QNA-DEV-USERPOOL"],
            Type:"Rules",
            AmbiguousRoleResolution:"Deny",
            RulesConfiguration:{Rules:[{
                Claim:"Cognito:Group",
                MatchType:"Equals",
                Value:"Admin",
                RoleARN:exports["QNA-DEV-ROLE-ARN"]
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
