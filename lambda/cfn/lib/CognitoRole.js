var Promise=require('./util/promise')
var aws=require('./util/aws')
var cognito=new aws.CognitoIdentity()

module.exports=class CognitoUser extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        var RoleMappings={}

        params.RoleMappings.map(function(x){
            var id="cognito-idp.us-east-1.amazonaws.com/"+x.UserPool+':'+x.ClientId
            delete x.ClientId
            delete x.UserPool
            RoleMappings[id]=x
        })

        cognito.getIdentityPoolRoles({
            IdentityPoolId:params.IdentityPoolId
        }).promise().tap(console.log)
        .then(function(result){
            result.Roles=Object.assign(result.Roles || {},params.Roles)
            result.RoleMappings=Object.assign(result.RoleMappings || {},RoleMappings)
            console.log(result)

            return cognito.setIdentityPoolRoles(result).promise()
        }).tap(console.log)
        .then(()=>reply(null,"RoleMapping"))
        .catch(reply)
    }
    
    Delete(ID,params,reply){
        var ids={}

        ids=params.RoleMappings.map(function(x){
            return "cognito-idp.us-east-1.amazonaws.com/"+x.UserPool+':'+x.ClientId
        })

        cognito.getIdentityPoolRoles({
            IdentityPoolId:params.IdentityPoolId
        }).promise().tap(console.log)
        .then(function(result){
            ids.forEach(function(x){
                delete result.RoleMappings[x]
            })
            console.log(result) 
            return cognito.setIdentityPoolRoles(result).promise()
        }).tap(console.log)
        .then(()=>reply(null,"RoleMapping"))
        .catch(reply)
    }
}




