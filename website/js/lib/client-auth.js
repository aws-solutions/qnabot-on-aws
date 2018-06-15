var aws=require('aws-sdk')
var axios=require('axios')
var _=require('lodash')
var query=require('query-string')
var jwt=require('jsonwebtoken')

module.exports=function(){
    return Promise.resolve(axios.head(window.location.href))
    .then(function(result){
        var stage=result.headers['api-stage']
        return Promise.resolve(axios.get(`/${stage}`)).then(x=>x['data'])
    })
    .then(function(info){
        var hash=window.location.hash.slice(1)
        var params=query.parse(hash)
        aws.config.region=info.region
        if(params.id_token){
            var token=jwt.decode(params.id_token)
            console.log(token)            
            var Logins={}
            Logins[[
                'cognito-idp.',
                info.region,
                '.amazonaws.com/',
                info.UserPool,
                ].join('')]=params.id_token
             
            var credentials=new aws.CognitoIdentityCredentials({
                IdentityPoolId:info.PoolId,
                RoleSessionName:token["cognito:username"],
                Logins:Logins
            })
            var username=token["cognito:username"]
        }else{
            var credentials=new aws.CognitoIdentityCredentials({
                IdentityPoolId:info.PoolId
            })
        }
        credentials.clearCachedId() 
        return Promise.resolve(credentials.getPromise()).then(x=>{return{
            credentials,
            username,
            Login:_.get(info,"_links.ClientLogin.href")
        }})
    })
    .then(function(result){
        aws.config.credentials=result.credentials
        return {
            config:aws.config,
            lex:new aws.LexRuntime(),
            polly:new aws.Polly(),
            username:result.username,
            Login:result.Login
        }
    })
}
