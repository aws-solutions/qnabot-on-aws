/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var query=require('query-string').stringify
var _=require('lodash')
var Promise=require('bluebird')
var axios=require('axios')
var Url=require('url')
var sign=require('aws4').sign
var path=require('path')
var Mutex=require('async-mutex').Mutex
var aws=require('aws-sdk')
const mutex = new Mutex();

var reason=function(r){
    return (err)=>{ 
        console.log(err)
        Promise.reject(r)
    }
}
var aws=require('aws-sdk')

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function getParameters(ssm, params) {
    return new Promise(function(resolve, reject) {
        ssm.getParameters(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                reject('Error back from request: ' + err);
            } else {
                const custom_settings = JSON.parse(data.Parameters[0].Value);
                const default_settings = JSON.parse(data.Parameters[1].Value);
                const cloned_default = _.clone(default_settings);
                const merged_settings = _.merge(cloned_default, custom_settings);
                const settings = [default_settings, custom_settings, merged_settings]
                resolve(settings);
            }
        })
    })
}

function saveParameters(ssm, params) {
    return new Promise(function(resolve, reject) {
        ssm.putParameter(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                reject('Error back from request: ' + err);
            } else {
                console.log('return data: ' + JSON.stringify(data));
                resolve(data)
            }
        })
    })
}

var failed=false
module.exports={
    async listSettings(context){
        aws.config.credentials=context.rootState.user.credentials
        const customParams = context.rootState.info.CustomQnABotSettings;
        const defaultParams = context.rootState.info.DefaultQnABotSettings;
        const ssm = new aws.SSM({region:context.rootState.info.region})
        const query = {
            Names: [customParams, defaultParams],
            WithDecryption:true,
        }
        var response = await getParameters(ssm, query);
        return response;
    },
    async updateSettings(context, settings){
        // console.log('params: ' + JSON.stringify(settings));
        aws.config.credentials=context.rootState.user.credentials
        const customParams=context.rootState.info.CustomQnABotSettings;
        const ssm = new aws.SSM({region:context.rootState.info.region})
        // Note type is not required in params if the parameter exists. Some customers require this parameter
        // to be a SecureString and set this type post deploy of QnABot. Removing type supports
        // this setting.
        const params = {
            Name: customParams,
            Value: JSON.stringify(settings),
            Overwrite: true
        }
        var response = await saveParameters(ssm, params);
        return response;
    }
    
}

