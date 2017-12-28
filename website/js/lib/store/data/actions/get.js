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
    schema(context){
        return api(context,'schema')
        .then(x=>context.commit('schema',x))
    },
    botinfo(context){
        return api(context,'botinfo')
        .then(function(data){
            context.commit('bot',data,{root:true})
        })
        .then(function(data){
            return Promise.join(
                api(context,'utterances'),
                api(context,'alexa')
            )
        })
        .spread(function(utterances,alexa){
            context.commit('utterances',utterances,{root:true})
            context.commit('alexa',alexa,{root:true})
        })
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed get BotInfo')
    },
    search(context,opts){
        _.defaults(opts,{
            query:opts.query,
            topic:opts.topic,
            perpage:opts.perpage
        })
        return api(context,'search',opts)
        .tap(()=>context.commit('clearQA'))
        .tap(result=>context.state.QAs=result.qa.map(x=>util.parse(x,context)))
        .tap(result=>context.commit('page/setTotal',result.total,{root:true}))
        .then(result=>result.qa.length)
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to get')
    },
    get(context,opts={}){
        _.defaults(opts,{
            filter:context.state.filter,
            order:opts.order || 'asc',
            perpage:opts.perpage
        })
        return api(context,'list',opts)
        .tap(()=>context.commit('clearQA'))
        .tap(result=>context.state.QAs=result.qa.map(x=>util.parse(x,context)))
        .tap(result=>context.commit('page/setTotal',result.total,{root:true}))
        .then(result=>result.qa.length)
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to get')
    },
    getAll(context){
        context.commit('clearQA')
         
        return new Promise(function(resolve,reject){
            var next=function(index){
                return context.dispatch('get',{page:index})
                    .then(count=>count < 1 ? resolve() : next(++index))
                    .error(err=>reject(err))
            }
            next(0)
        })
        .tapCatch(e=>console.log('Error:',e))
        .catchThrow('Failed to getAll')
    }
}
