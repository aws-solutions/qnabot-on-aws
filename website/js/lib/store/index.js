// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Vuex=require('vuex')


module.exports=new Vuex.Store({
    state:{
        info:{},
        bot:{
            status:"",
            message:"",
            utterances:[],
            alexa:{},
            connect:{}
        },
        alexa:{},
        connect:{},
        error:""
    },
    mutations:require('./mutations'),
    getters:require('./getters'),
    actions:require('./actions'),
    modules:{
        user:require('./user'),
        api:require('./api'),
        data:require('./data'),
        page:require('./page')
    }
})
