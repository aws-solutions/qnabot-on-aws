var Promise=require('./util/promise')
var aws=require('./util/aws')
var cognito=new aws.CognitoIdentity()

module.exports=class CognitoRole extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        var RoleMappings={}

        params.RoleMappings.map(function(x){
            var id="cognito-idp."+(process.env.AWS_REGION || "us-east-1")+".amazonaws.com/"+x.UserPool+':'+x.ClientId
            delete x.ClientId
            delete x.UserPool
            RoleMappings[id]=x
        })

        cognito.getIdentityPoolRoles({
            IdentityPoolId:params.IdentityPoolId
        }).promise().tap(console.log)
        .then(function(result){
            //result.Roles=Object.assign(result.Roles || {},params.Roles)
            //result.RoleMappings=Object.assign(result.RoleMappings || {},RoleMappings)
            //Overwrite any existing roles and mappings with new ones - existing mappings may no longer be valid after an upgrade.
            result.Roles=params.Roles;
            result.RoleMappings=RoleMappings;
            console.log(result)

            return cognito.setIdentityPoolRoles(result).promise()
        }).tap(console.log)
        .then(()=>reply(null,"RoleMapping"))
        .catch(reply)
    }
    Update(ID,params,oldparams,reply){
        this.Create(params,reply);
    }
    Delete(ID,params,reply){
        var ids={}

        ids=params.RoleMappings.map(function(x){
            return "cognito-idp."+(process.env.AWS_REGION || "us-east-1")+".amazonaws.com/"+x.UserPool+':'+x.ClientId
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




