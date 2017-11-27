var Promise=require('./util/promise')
var aws=require('./util/aws')
var cognito=new aws.CognitoIdentityServiceProvider()
var crypto=Promise.promisifyAll(require('crypto'))

module.exports=class CognitoUser extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        var loginUrl=[
            "https://",
            domain,
            ".auth.",
            process.env.AWS_REGION,
            ".amazoncognito.com",
            "/login?redirect_uri=",encodeURIComponent(params.LoginRedirectUrl),"&",
            "response_type=token&",
            "client_id=",params.ClientId
        ].join("")

        reply(null,domain,{
            loginUrl,
            logoutUrl:[
                "https://",
                domain,
                ".auth.",
                process.env.AWS_REGION,
                ".amazoncognito.com",
                "/logout?redirect_uri=",encodeURIComponent(loginUrl),"&",
                "response_type=token&",
                "client_id=",params.ClientId
            ].join("")
        })
    }
}
