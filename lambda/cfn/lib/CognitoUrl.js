var Promise=require('./util/promise')
var aws=require('./util/aws')
var cognito=new aws.CognitoIdentityServiceProvider()
var crypto=Promise.promisifyAll(require('crypto'))

module.exports=class CognitoUrl extends require('./base') {
    constructor(){
        super()
    }
    Update(ID,params,oldparams,reply){
        this.Create(params,reply)
    }
    Create(params,reply){
        var Domain=[
            "https://",
            params.Domain,
            ".auth.",
            process.env.AWS_REGION,
            ".amazoncognito.com",
        ].join('')
        var loginUrl=[
            Domain,
            "/login?redirect_uri=",encodeURIComponent(params.LoginRedirectUrl),"&",
            `response_type=${params.response_type}&`,
            "client_id=",params.ClientId
        ].join("")

        reply(null,params.Domain,{
            Domain,
            loginUrl,
            logoutUrl:[
                Domain,
                "/logout?redirect_uri=",encodeURIComponent(loginUrl),"&",
                "response_type=token&",
                "client_id=",params.ClientId
            ].join("")
        })
    }
}
