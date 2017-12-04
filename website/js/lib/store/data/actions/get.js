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
    botinfo(context){
        return api(context,'botinfo')
        .then(function(data){
            context.commit('bot',data,{root:true})
        })
        .then(function(data){
            return api(context,'utterances')
        })
        .then(function(data){
            context.commit('utterances',data,{root:true})
        })
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed get BotInfo')
    },
    search(context,{query,topic}){
      context.commit('clearQA')
      return util.load.bind(context)(api(context,'search',{
            query,topic 
      })).tapCatch(e=>console.log('Error:',e))
      .catchThrow('Failed to search')
    },
    get(context,page){
        return api(context,'list',{
            page,
            filter:context.state.filter.query,
            perpage:context.rootState.page.perpage
        })
        .tap(x=>console.log("results",x))
        .tap(result=>{
            return context.state.QAs=context.state.QAs
                        .concat(result.qa.map(x=>util.parse(x,context)))
            }
        )
        .tap(result=>context.commit('page/setTotal',result.total,{root:true}))
        .then(result=>result.qa.length)
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to get')
    },
    getAll(context){
        context.commit('clearQA')
         
        return new Promise(function(resolve,reject){
            var next=function(index){
                return context.dispatch('get',index)
                    .then(count=>count < 1 ? resolve() : next(++index))
                    .error(err=>reject(err))
            }
            next(0)
        })
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to getAll')
    }
}
