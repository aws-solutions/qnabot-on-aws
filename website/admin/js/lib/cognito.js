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
aws.config.setPromisesDependency(Promise);
var cognito=require('amazon-cognito-identity-js')

module.exports=class {
    constructor(){ 
        var self=this 
        self.ready=Promise.resolve(axios.get(window.location.origin+'/api/info'))
            .get('data')
            .then(function(config){
            self.config=config
            aws.config.region=config.region
            self.userPool = new cognito.CognitoUserPool({ 
                UserPoolId : config.UserPool,
                ClientId : config.ClientId
            });
        })
    }
    logout(){
        var self=this 
        if(self.cognitoUser){
            return self.ready.then(function(){
                self.cognitoUser.globalSignOut({
                    onFailure:console.log,
                    onSuccess:function(){
                        self.cognitoUser=null
                    }
                })
            })
        }
    }

    getCurrent(){
        var self=this
        return new Promise(function(res,rej){
            return self.ready.then(function(){
                self.cognitoUser = self.userPool.getCurrentUser();
                if(self.cognitoUser){
                    self.cognitoUser.getSession(function(err,result){
                        err ? rej(err) : res(self.getCredentials(result))
                    })
                }else{
                    res(null)
                }
            })
        })
    }
    getCredentials(result){
        var self=this
        var Logins={}
        Logins['cognito-idp.'+
            self.config.region+
            '.amazonaws.com/'+
            self.config.UserPool]=result.getIdToken().getJwtToken()
        
        aws.config.credentials=new aws.CognitoIdentityCredentials({
            IdentityPoolId : self.config.PoolId, 
            Logins
        })

        return new Promise(function(resolve,reject){ 
            aws.config.getCredentials(function(err){
                err ? reject(err) : resolve(aws.config.credentials)
            })
        })
    }
    authenticated(Username,Password){
        var self=this
        return self.ready.then(function(){
            var authenticationDetails = new cognito
                .AuthenticationDetails({
                    Username,
                    Password
                });

            self.cognitoUser = new cognito.CognitoUser({
                    Username,
                    Pool : self.userPool
                });

            return new Promise(function(resolve,reject){
                self.cognitoUser.authenticateUser(authenticationDetails, {
                    onSuccess: resolve,
                    onFailure:reject
                });
            })
            .then(self.getCredentials.bind(self))
        })
    }
    unauthenticated(){
        var self=this
        var cognitoidentity 

        return self.ready.then(function(){
            cognitoidentity = new aws.CognitoIdentity();
            return cognitoidentity.getId({
                IdentityPoolId:self.config.PoolId
            }).promise()
        })
        .get("IdentityId")
        .then(function(id){
            return cognitoidentity.getCredentialsForIdentity({
                IdentityId:id
            }).promise()
        })
        .then(creds=>creds.Credentials)
    }

}
