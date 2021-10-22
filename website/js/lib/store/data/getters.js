// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Promise=require('bluebird')

module.exports={
    selected(state){
        return state.QAs.map(qa=>qa.select)
    },
    QAlist(state,getters,rootGetters){
        if(rootGetters.page.mode!=='test'){
            return state.QAs.sort(function(a,b){
                if (a.qid.text < b.qid.text)
                    return -1;
                if (a.qid.text > b.qid.text)
                    return 1;
                return 0;
            })
        }else{
            return state.QAs.sort(function(a,b){
                return b.score-a.score
            })
        }
    }
}
