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
var lib=require('./index.js')
var SDK=require('./api.js')
var cognito=new (require('./cognito.js'))()
var store=require('./store')

exports.getCurrent=function(){
    return cognito.getCurrent()
    .then(function(credentials){
        if(credentials){
            var client=new SDK(credentials)
            return client.ready
                .then(()=>store.commit('login'))
                .then(()=>store.commit('setId',client.Id))
                .then(()=>store.commit('setClient',client))
                .return(true)
        }else{
            return false
        }
    })
}

exports.login=function(name,password) {
    store.commit('clearClient')
    
    return cognito.authenticated(name,password)
    .then(function(credentials){
        var client=new SDK(credentials)
        return client.ready
            .then(()=>store.commit('login'))
            .then(()=>store.commit('setId',client.Id))
            .then(()=>store.commit('setClient',client))
            .return(client)
    })
    .return(true)
}

exports.logOut=function() {
    store.commit('logout')
    store.commit('clearClient')
    store.commit('clearQA')
    return cognito.logout()
}

