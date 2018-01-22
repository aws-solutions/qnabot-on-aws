/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var _=require('lodash')
var query=require('query-string')
var jwt=require('jsonwebtoken')
var set=require('vue').set
var aws=require('aws-sdk')

module.exports={
    captureHash:function(state){
        set(state,'hash',location.hash.substring(2))
    },
    credentials:function(state,payload){
        set(state,'loggedin',true)
        set(state,'credentials',payload)
    },
    token:function(state,rootState){
        try {
            var id_token=window.sessionStorage.getItem('id_token')
            
            if(id_token){
                var token=jwt.decode(id_token)
            }else{
                var params=query.parse(state.hash)
                var id_token=params.id_token
                var token=jwt.decode(params.id_token)
                window.sessionStorage.setItem('id_token',params.id_token)
            }
            
            set(state,'name',token["cognito:username"])
            set(state,'groups',token["cognito:groups"])
            set(state,'token',id_token)
            console.log('auth',state.groups) 
            if(!state.groups || !state.groups.includes('Admins')){
                var login=_.get(rootState,"info._links.DesignerLogin.href")
                window.alert("You must be an administrative user to view this page") 
                window.window.location.href=login
            }
            state.Logins={}
            state.Logins[[
                'cognito-idp.',
                rootState.info.region,
                '.amazonaws.com/',
                rootState.info.UserPool,
                ].join('')]=state.token

        } catch(e){
            console.log(e)
            rootState.error="Missing or invalide Authentication token, please Login"
        }
    },
    login(state){
        state.loggedIn=true
    },
    logout(state){
        state.loggedIn=false
    },
    setId(state,Id){
        state.Id=Id
    }
}
