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
var aws=require('aws-sdk')

module.exports={
    logout:function(context){
        window.sessionStorage.clear()
    },
    login:function(context){
        context.commit('token',context.rootState) 
        aws.config.region=context.rootState.info.region
         
        var credentials=new aws.CognitoIdentityCredentials({
            IdentityPoolId:context.rootState.info.PoolId,
            RoleSessionName:context.state.name,
            Logins:context.state.Logins
        })
        credentials.clearCachedId() 

        return Promise.delay(0)
        .then(()=>credentials.getPromise())
        .then(function(){
            context.commit('credentials',credentials)
        })
    }
}
