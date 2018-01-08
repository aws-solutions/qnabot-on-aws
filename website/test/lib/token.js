var aws=require('aws-sdk')
var Promise=require('bluebird')
var Exports=require('../../../bin/env')
var cdp=new aws.CognitoIdentityServiceProvider()
var cognito = require('amazon-cognito-identity-js')
var faker=require('faker')

return Exports.then(function(exports){
    var UserPoolId=exports['QNA-DEV-MASTER-USER-POOL'],
    var ClientId=exports['QNA-DEV-MASTER-DESIGNER-CLIENT-ID']
    var username=faker.internet.userName()
    
    var userpool=new cognito.CognitoUserPool({
        UserPoolId,ClientId
    })
    
    var auth=new cognito.AuthenticationDetails({
        Username:username,
        Password:pass
    })

    var user=new cognito.CognitoUser({
        Username:username,
        Pool:userpool
    })
    return new Promise(function(res,rej){ 
        user.authenticateUser(auth,{
            onSuccess:res,
            onFailure:rej,
            newPasswordRequired:function(userAttributes,requiredAttributes){
                delete userAttributes.email_verified;
                pass="123$dDadadfasdf"
                user.completeNewPasswordChallenge(
                    pass, 
                    userAttributes, 
                    this);
            }
        })
    })
})

