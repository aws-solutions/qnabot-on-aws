var Promise=require('./util/promise')
var aws=require('./util/aws')
var cognito=new aws.CognitoIdentityServiceProvider()
var crypto=Promise.promisifyAll(require('crypto'))

module.exports=class CognitoLogin extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        var url=params.CallbackUrl
        
        return cognito.updateUserPoolClient({
            ClientId:params.ClientId,
            UserPoolId:params.UserPool,
            CallbackURLs:params.LoginCallbackUrls,
            LogoutURLs:params.LogoutCallbackUrls,
            ExplicitAuthFlows:["ADMIN_NO_SRP_AUTH"],
            RefreshTokenValidity:1,
            SupportedIdentityProviders:['COGNITO'],
            AllowedOAuthFlows:[ 'code', 'implicit'],
            AllowedOAuthScopes:['phone', 'email', 'openid', 'profile'],
            AllowedOAuthFlowsUserPoolClient:true
        }).promise()
        .then(function(){
            if(params.ImageBucket && params.ImageKey){
                return (new aws.S3()).getObject({
                    Bucket:params.ImageBucket,
                    Key:params.ImageKey
                }).promise().get('content').then(x=>params.Image=x)
            }
        })
        .then(function(){
            return cognito.setUICustomization({
                ClientId:params.ClientId,
                UserPoolId:params.UserPool,
                CSS:params.CSS
            })
        })
        .then(()=>reply(null,url))
        .catch(reply)
    }
}




