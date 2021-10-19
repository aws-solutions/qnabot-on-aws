// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Vuex=require('vuex')
module.exports={
    namespaced: true,
    state:{ 
        loading:false
    },
    mutations:{
        loading:function(state,val){
            state.loading=val 
        }
    },
    getters:{},
    actions:require('./actions')
}
