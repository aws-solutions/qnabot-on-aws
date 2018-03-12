/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')
var axios=require('axios')
var jwt=require('jsonwebtoken')
var aws=require('aws-sdk')
var _=require('lodash')
var set=require('vue').set
var query=require('query-string')

module.exports={
    refreshTokens:async function(context){
        console.log("refreshing tokens")
        var refresh_token=window.sessionStorage.getItem('refresh_token')
        var endpoint=context.rootState.info._links.CognitoEndpoint.href
        var clientId=context.rootState.info.ClientIdDesigner 
        
        try {
            var tokens=await axios({
                method:"POST",
                url:`${endpoint}/oauth2/token`,
                headers:{
                    "Content-Type":'application/x-www-form-urlencoded'
                },
                data:query.stringify({ 
                    grant_type:'refresh_token',
                    client_id:clientId,
                    refresh_token:refresh_token
                })
            })
            console.log("token",tokens)
            window.sessionStorage.setItem('id_token',tokens.data.id_token)
            window.sessionStorage.setItem('access_token',tokens.data.access_token)
            window.sessionStorage.setItem('refresh_token',tokens.data.refresh_token)
            set(context.state,'token',tokens.data.id_token)
        }catch(e){
            var login=_.get(context,"rootState.info._links.DesignerLogin.href")
            var result=window.confirm("Your credentials have expired, please log back in. Click Ok to be redirected to the login page.") 
            if(result){
                context.dispatch('logout')  
                window.window.location.href=login
            }
        }
    },
    getCredentials:Promise.method(async function(context){
        try {
            if(!_.get(context,'state.credentials')){
                return await getCredentials(context)
            }else if(context.state.credentials.needsRefresh()){
                return await getCredentials(context)
            }else{
                return context.state.credentials
            }
        }catch(e){
            console.log(e)
            if(e.message.match('Token expired') || e.message.match('inactive')){
                await context.dispatch('refreshTokens')     
                return await getCredentials(context)
            }else{
                throw e
            }
        }
    }),
    logout:function(context){
        window.sessionStorage.clear()
    },
    login:async function(context){
        aws.config.region=context.rootState.info.region
        
        var id_token=window.sessionStorage.getItem('id_token')
            
        if(id_token && id_token!=="undefined"){
            var token=jwt.decode(id_token)
            set(context.state,'token',id_token)
        }else{
            var code=query.parse(window.location.search).code
            var token=jwt.decode(await getTokens(context,code))
        }
        
        set(context.state,'name',token["cognito:username"])
        set(context.state,'groups',token["cognito:groups"])
        
        if(!context.state.groups || !context.state.groups.includes('Admins')){
            var login=_.get(context.rootState,"info._links.DesignerLogin.href")
            window.alert("You must be an administrative user to view this page") 
            window.window.location.href=login
        }
    }
}
async function getCredentials(context){
    var Logins={}
    Logins[[
        'cognito-idp.',
        context.rootState.info.region,
        '.amazonaws.com/',
        context.rootState.info.UserPool,
        ].join('')]=context.state.token
    
    set(context.state,"credentials",new aws.CognitoIdentityCredentials({
        IdentityPoolId:context.rootState.info.PoolId,
        RoleSessionName:context.state.name,
        Logins
    }))
    await context.state.credentials.getPromise()
    return context.state.credentials
}
async function getTokens(context,code){
    var endpoint=context.rootState.info._links.CognitoEndpoint.href
    var clientId=context.rootState.info.ClientIdDesigner 
    try {
        var tokens=await axios({
            method:'POST',
            url:`${endpoint}/oauth2/token`,
            headers:{
                "Content-Type":'application/x-www-form-urlencoded'
            },
            data:query.stringify({
                grant_type:'authorization_code',
                client_id:clientId,
                code:code,
                redirect_uri:window.location.origin+window.location.pathname
            })
        })
        window.sessionStorage.setItem('id_token',tokens.data.id_token)
        window.sessionStorage.setItem('access_token',tokens.data.access_token)
        window.sessionStorage.setItem('refresh_token',tokens.data.refresh_token)
        set(context.state,'token',tokens.data.id_token)
        return tokens.data.id_token 
    }catch(e){
        var login=_.get(context,"rootState.info._links.DesignerLogin.href")
        var result=window.confirm("Unable to fetch credentials, please log back in. Click Ok to be redirected to the login page.") 
        if(result){
            context.dispatch('logout')  
            window.window.location.href=login
        }
    }
}
