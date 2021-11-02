// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var _=require('lodash')
var query=require('query-string')
var jwt=require('jsonwebtoken')
var set=require('vue').set
var aws=require('aws-sdk')

module.exports={
    credentials:function(state,payload){
        set(state,'loggedin',true)
        set(state,'credentials',payload)
    },
    login(state){
        state.loggedIn=true
    },
    setId(state,Id){
        state.Id=Id
    }
}
