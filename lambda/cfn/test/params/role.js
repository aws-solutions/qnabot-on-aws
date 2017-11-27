var base=require('./base')
var Promise=require('bluebird')
var cfExports=require('../../bin/exports')

var setup=cfExports.then(function(exports){
    var param={
        IdentityPoolId:exports["ENVOY-IDPOOL"],
        Roles:{'authenticated':"arn:aws:iam::613341023709:role/ENVOY-dev-environment-35-Cognito-AuthenticatedRole-CUKIABDAZHA5"},
        RoleMappings:[{
            ClientId:exports["ENVOY-CLIENTID"],
            UserPool:exports["ENVOY-USERPOOL"],
            Type:"Rules",
            AmbiguousRoleResolution:"Deny",
            RulesConfiguration:{Rules:[{
                Claim:"Cognito:Group",
                MatchType:"Equals",
                Value:"Admin",
                //RoleARN:exports["ENVOY-ROLE-ARN"]
                RoleARN:"arn:aws:iam::613341023709:role/ENVOY-dev-environment-35-Cognito-AuthenticatedRole-CUKIABDAZHA5"
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
