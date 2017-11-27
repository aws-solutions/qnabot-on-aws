var Promise=require('./util/promise')
var aws=require('./util/aws')
var cognito=new aws.CognitoIdentityServiceProvider()

module.exports=class CognitoUser extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        cognito.adminCreateUser({
            UserPoolId:process.env.USERPOOL,
            Username:params.UserName,
            TemporaryPassword:params.Password+'1'
        }).promise()
        .log("Created User")
        .then(function(){
            return cognito.adminInitiateAuth({
                AuthFlow: 'ADMIN_NO_SRP_AUTH', 
                ClientId: process.env.CLIENT,
                UserPoolId:process.env.USERPOOL,
                AuthParameters: {
                    USERNAME: params.UserName,
                    PASSWORD: params.Password+'1',
                }
            }).promise()
        })
        .log("User Loged In")
        .then(function(session){
            return cognito.adminRespondToAuthChallenge({
                ClientId: process.env.CLIENT,
                UserPoolId:process.env.USERPOOL,
                ChallengeName:"NEW_PASSWORD_REQUIRED",
                ChallengeResponses:{
                    USERNAME: params.UserName,
                    NEW_PASSWORD:params.Password
                },
                Session:session.Session
            }).promise()
        })
        .log("Password changed")
        .then(()=>reply(null))
        .catch(err=>reply(err))
    }

    Update(ID,params,oldparams,reply){
        reply(null)
    }
    
    Delete(ID,params,reply){
        cognito.adminDeleteUser({
            UserPoolId:process.env.USERPOOL,
            Username:params.UserName
        }).promise()
        .then(()=>reply(null))
        .catch(err=>reply(err))
    }
}




