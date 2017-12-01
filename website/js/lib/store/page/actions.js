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
var validator = new (require('jsonschema').Validator)();
var axios=require('axios')
var util=require('./util')
var api=util.api

module.exports={
    setMode(context,mode){
        context.commit('setMode',mode)
        if(mode==='questions'){
            context.dispatch('goToPage',context.state.current)
        }else{
        }
    },
    goToPage(context,index){
        context.commit('data/clearQA',null,{root:true})
        context.commit('setPage',index)
        return context.dispatch('data/get',index,{root:true})
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to Build')
    },
    nextPage(context){
        var index=context.state.current+1
        var total=Math.ceil(context.state.total/context.state.perpage)
        index=index > total-1 ? total-1 : index
        return context.dispatch('goToPage',index)
    },
    previousPage(context){
        var index=context.state.current-1
        index=index < 0 ? 0 : index
        return context.dispatch('goToPage',index)
    }
}
