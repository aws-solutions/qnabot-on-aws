var Promise=require('bluebird')
var aws=require('aws-sdk')
var axios=require('axios')
var _=require('lodash')
var query=require('query-string')
var jwt=require('jsonwebtoken')

module.exports=function(){
    return Promise.resolve(axios.head(window.location.href))
    .then(function(result){
        var stage=result.headers['api-stage']
        return Promise.resolve(axios.get(`/${stage}/info`)).get('data')
    })
    .then(function(info){
        var hash=window.location.hash.slice(1)
        var params=query.parse(hash)
        aws.config.region=info.region
        if(params.id_token){
            var token=jwt.decode(params.id_token)
            
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
        }else{
            var credentials=new aws.CognitoIdentityCredentials({
                IdentityPoolId:info.PoolId
            })
        }
        credentials.clearCachedId() 
        return Promise.resolve(credentials.getPromise()).return(credentials)
    })
    .then(function(credentials){
        aws.config.credentials=credentials
        return {
            config:aws.config,
            lex:new aws.LexRuntime(),
            polly:new aws.Polly()
        }
    })
}
