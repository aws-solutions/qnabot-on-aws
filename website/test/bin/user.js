#! /usr/bin/env node
var aws=require('aws-sdk')
var Promise=require('bluebird')
var outputs=require('../../../bin/exports')
var cdp=new aws.CognitoIdentityServiceProvider()
var cognito = require('amazon-cognito-identity-js')
var fs=require('fs')
var faker=require('faker')

if (require.main === module) {
    console.log(process.argv)
    if(process.argv[2]==="--create"){
        create().then(function(config){
            fs.writeFileSync(__dirname+'/../user-config.json',JSON.stringify(config))
        })
    }else if(process.argv[2]==="--delete"){
        var user=require('../user-config.json')
        rm(user.username)
    }
}

exports.delete=rm
exports.create=create

function rm(name){
    return outputs('dev/master').then(function(output){
        return cdp.adminDeleteUser({
            UserPoolId:output.UserPool,
            Username:name
        }).promise()
    })
}

function create(){
    return outputs('dev/master').then(function(output){
        var UserPoolId=output.UserPool
        var ClientId=output.DesignerClientId
        var Username=faker.internet.userName()
        var password=[
            faker.internet.password(),
            faker.random.arrayElement([1,2,3,4,5,6,7,8,9]),
            faker.random.arrayElement(["a","b","c"]),
            faker.random.arrayElement(["A","B","C"]),
            faker.random.arrayElement(["@","!","#","$"])
        ].join('')
        var userpool=new cognito.CognitoUserPool({
            UserPoolId,ClientId
        })
        
        return cdp.adminCreateUser({
            UserPoolId,
            Username,
            TemporaryPassword:password,
            UserAttributes:[{
                Name:"email",
                Value:faker.internet.exampleEmail()
            }]
        }).promise()
        .then(function(){
            return cdp.adminAddUserToGroup({
                UserPoolId,
                Username,
                GroupName:"Admins"
            }).promise()
        })
        .then(function(){
            var auth=new cognito.AuthenticationDetails({
                Username:Username,
                Password:password
            })

            var user=new cognito.CognitoUser({
                Username:Username,
                Pool:userpool
            })
            
            return new Promise(function(res,rej){ 
                user.authenticateUser(auth,{
                    onSuccess:res,
                    onFailure:rej,
                    newPasswordRequired:function(userAttributes,requiredAttributes){
                        delete userAttributes.email_verified;
                        password=password+'1'
                        pass=password
                        user.completeNewPasswordChallenge(
                            pass, 
                            {}, 
                            this);
                    }
                })
            })
            .return({
                username:Username,
                password:password+'1'
            })
        })
    })
}
