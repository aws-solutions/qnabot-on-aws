// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var set=require('vue').set
module.exports={
    captureHash:function(state){
        state.hash=location.hash.substring(1)
    },
    info:function(state,payload){
        state.info=payload
    },
    bot:function(state,payload){
        var tmp=state.bot.utterances
        state.bot=payload
        set(state.bot,"utterances",tmp)
    },
    utterances:function(state,payload){
        set(state.bot,"utterances",payload)
    },
    alexa:function(state,payload){
        set(state.bot,"alexa",payload)
    },
    setBotInfo(store,data){
        data.lambdaName=data.lambdaArn.match(/arn:aws:lambda:.*:.*:function:(.*)/)[1]
        store.bot=data
    },
    setError(store,message){
        store.error=message
    },
    clearError(store){
        store.error=null
    }
}
